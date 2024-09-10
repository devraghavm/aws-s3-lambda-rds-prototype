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
import { CsvRow } from "../../layers/service-layer/interfaces/csv.row";
import { Service } from "../../layers/service-layer/service"; // Import the Service class
import { IResult } from "mssql";

// Configure AWS SDK
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// AWS.config.update({ region: "us-west-2" });

const s3 = new S3({
  region: "us-west-2",
});
const sns = new SNS({
  region: "us-west-2",
});

const extractCsvData = (csvData: Readable): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    csvData
      .pipe(csv())
      .on("data", (data: CsvRow) => rows.push(data))
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

export const handler = async (
  event: SNSEvent,
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
      console.log(
        `Processing S3 event from bucket ${bucketName} for object ${objectKey}`,
      );

      const params = {
        Bucket: bucketName,
        Key: objectKey,
      };

      const s3Object = await s3.getObject(params);

      console.log("Retrieved object from S3:", s3Object);
      const csvData = s3Object.Body as Readable;
      console.log("Parsing CSV data:", csvData);

      const rows = await extractCsvData(csvData);
      const service = new Service();
      const result = await service.insertMany(rows);
      console.log("Inserted rows", result);
      callback(null, "Data inserted successfully");
    } else {
      // Process non-SNS event
      const service = new Service(); // Use lowercase 'service'
      const result: IResult<CsvRow[]> = await service.readAll();
      const rows: CsvRow[] = result.recordset;
      const payload = {
        size: rows.length,
        rows,
      };
      callback(null, JSON.stringify(payload));
    }
  } catch (error) {
    console.error("Error processing event", error);
    callback(error as Error);
  }
};
