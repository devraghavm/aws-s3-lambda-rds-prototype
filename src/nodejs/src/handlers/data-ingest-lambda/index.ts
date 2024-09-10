import {
  S3Event,
  SNSEvent,
  Context,
  Callback,
  S3EventRecord,
} from "aws-lambda";
import { S3 } from "@aws-sdk/client-s3";
import { SNS } from "@aws-sdk/client-sns";
import csv from "csv-parser";
import { Readable } from "stream";
import { IrsCsvRow } from "../../layers/service-layer/interface/irs.csv.row";
import { IrsEmployerService } from "../../layers/service-layer/service/irs.employer.service";
import { MyuiEmployerService } from "../../layers/service-layer/service/myui.employer.service";
import { IService } from "../../layers/service-layer/contract/iservice";
import logger from "../../layers/service-layer/config/logger.config";
import { MyuiCsvRow } from "../../layers/service-layer/interface/myui.csv.row";

const s3 = new S3({
  region: "us-west-2",
});
const sns = new SNS({
  region: "us-west-2",
});

function processCsvData<T>(
  csvData: any,
  resolve: (value: T[]) => void,
  reject: (reason?: any) => void,
): void {
  const rows: T[] = [];
  csvData
    .pipe(csv())
    .on("data", (data: T) => rows.push(data))
    .on("end", () => resolve(rows))
    .on("error", (error: Error) => {
      logger.error("Error processing CSV data", error);
      reject(error);
    });
}

const extractCsvData = (
  csvData: Readable,
  type: string,
): Promise<IrsCsvRow[]> => {
  return new Promise((resolve, reject) => {
    if (type === "irs") {
      processCsvData<IrsCsvRow>(csvData, resolve, reject);
    } else if (type === "myui") {
      processCsvData<MyuiCsvRow>(csvData, resolve, reject);
    }
  });
};

/**
 * Lambda handler for processing S3 events.
 * @param event - The S3 event.
 * @param context - The Lambda context.
 * @param callback - The callback function.
 */
export const handler = async (
  event: SNSEvent | any,
  context: Context,
  callback: Callback,
) => {
  try {
    // Process SNS event
    if (event.Records && event.Records[0].Sns) {
      const s3Event: S3Event = JSON.parse(event.Records[0].Sns.Message);
      const record: S3EventRecord = s3Event.Records[0];

      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;
      logger.info(
        `Processing S3 event from bucket ${bucketName} for object ${objectKey}`,
      );

      const params = {
        Bucket: bucketName,
        Key: objectKey,
      };

      const s3Object = await s3.getObject(params);

      logger.info(`Retrieved object from S3: ${s3Object}`);
      const csvData = s3Object.Body as Readable;
      logger.info(`Parsing CSV data: ${csvData}`);

      const serviceType = objectKey.includes("irs")
        ? "irs"
        : objectKey.includes("myui")
          ? "myui"
          : null;

      if (!serviceType) {
        throw new Error(`Invalid object key: ${objectKey}`);
      }

      let service: IService<IrsCsvRow | MyuiCsvRow>;

      switch (serviceType) {
        case "irs":
          service = new IrsEmployerService();
          break;
        case "myui":
          service = new MyuiEmployerService();
          break;
        default:
          throw new Error(`Invalid service type: ${serviceType}`);
      }

      const rows = await extractCsvData(csvData, serviceType);
      const result = await service.insertMany(rows);
      logger.info(`Inserted rows ${result}`);
      callback(null, "Data inserted successfully");
    } else {
      // Process non-SNS event
      let service: IService<IrsCsvRow | MyuiCsvRow>;
      switch (event?.type) {
        case "irs":
          service = new IrsEmployerService();
          break;
        case "myui":
          service = new MyuiEmployerService();
          break;
        default:
          throw new Error(`Invalid event type: ${event?.type}`);
      }
      const result = await service.readAll();
      const rows = result.recordset;
      const payload = {
        size: rows.length,
        rows,
      };
      callback(null, JSON.stringify(payload));
    }
  } catch (error: any) {
    console.error("Error processing event", error);
    callback(new Error(`Error processing event: ${error?.message}`));
  }
};
