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
import { ReportJobRunService } from "../../layers/service-layer/service/report.job.run.service";
import { IService } from "../../layers/service-layer/contract/iservice";
import logger from "../../layers/service-layer/config/logger.config";
import { MyuiCsvRow } from "../../layers/service-layer/interface/myui.csv.row";
import { ReportJobRun } from "../../layers/service-layer/interface/report.job.run";
import { ReportJobService } from "../../layers/service-layer/service/report.job.service";
import { ReportJob } from "../../layers/service-layer/interface/report.job";
import { ReportRunStatusService } from "../../layers/service-layer/service/report.run.status.service";
import { ReportJobRunStatus } from "../../layers/service-layer/enum/report.job.run.status";

const s3 = new S3({
  region: "us-west-2",
});
const sns = new SNS({
  region: "us-west-2",
});

function processCsvData<T>(
  csvData: any,
  runId: number,
  resolve: (value: T[]) => void,
  reject: (reason?: any) => void,
): void {
  const rows: T[] = [];
  csvData
    .pipe(csv())
    .on("data", (data: T) => rows.push({ ...data, run_id: runId }))
    .on("end", () => resolve(rows))
    .on("error", (error: Error) => {
      logger.error("Error processing CSV data", error);
      reject(error);
    });
}

const extractCsvData = (
  csvData: Readable,
  runId: number,
  type: string,
): Promise<IrsCsvRow[]> => {
  return new Promise((resolve, reject) => {
    if (type === "irs") {
      processCsvData<IrsCsvRow>(csvData, runId, resolve, reject);
    } else if (type === "myui") {
      processCsvData<MyuiCsvRow>(csvData, runId, resolve, reject);
    }
  });
};

const readAll = async (service: IService<IrsCsvRow | MyuiCsvRow>) => {
  const result = await service.readAll();
  const rows = result.recordset;
  const payload = {
    size: rows.length,
    rows,
  };
  return payload;
};

const generateReportRunId = async (
  service: IService<ReportJobRun>,
  job_id: number | undefined,
) => {
  const run_id = await service.genreateId();
  await service.insert({
    run_id,
    run_name: "IRS_940_REPORT",
    run_description: "Run to generate IRS 940 report",
    job_id,
  });
  const reportRunStatusService = new ReportRunStatusService();
  const statusResult = await reportRunStatusService.insert({
    run_id,
    run_status: ReportJobRunStatus.STARTED,
    run_message: "Report run started",
  });
  return statusResult;
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
      const reportJobRunStatusService = new ReportRunStatusService();
      const runId = await reportJobRunStatusService.retrieveRunId();
      switch (serviceType) {
        case "irs":
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_STAGE_STARTED,
            run_message: "IRS data stage started",
          });
          service = new IrsEmployerService();
          const irsRows = await extractCsvData(csvData, runId, serviceType);
          const irsResult = await service.insertMany(irsRows);
          logger.info(`Inserted rows ${irsResult}`);
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_STAGE_COMPLETED,
            run_message: "IRS data stage completed",
          });
          break;
        case "myui":
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.MYUI_STAGE_STARTED,
            run_message: "MYUI data stage started",
          });
          service = new MyuiEmployerService();
          const myuiRows = await extractCsvData(csvData, runId, serviceType);
          const myuiResult = await service.insertMany(myuiRows);
          logger.info(`Inserted rows ${myuiResult}`);
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.MYUI_STAGE_COMPLETED,
            run_message: "MYUI data stage completed",
          });
          break;
        default:
          throw new Error(`Invalid service type: ${serviceType}`);
      }
      const isStageCompleted =
        await reportJobRunStatusService.isStageCompleted(runId);
      if (isStageCompleted) {
        // fire an SNS event to trigger the next stage
        const snsParams = {
          Message: JSON.stringify({
            type: "trigger-compare",
          }),
          TopicArn: process.env.SNS_TOPIC_ARN,
        };
        await sns.publish(snsParams);
      }
      callback(null, "Data inserted successfully");
    } else {
      // Process non-SNS event
      let service: IService<IrsCsvRow | MyuiCsvRow | ReportJob | ReportJobRun>;
      let payload: any;
      switch (event?.type) {
        case "irs-read-all":
          service = new IrsEmployerService();
          payload = await readAll(service);
          break;
        case "myui-read-all":
          service = new MyuiEmployerService();
          payload = await readAll(service);
          break;
        case "generate-report-run-id":
          const reportJobService = new ReportJobService();
          const reportJobResult =
            await reportJobService.readByJobName("IRS_940_JOB");
          const reportJob = reportJobResult?.recordset[0];
          service = new ReportJobRunService();
          payload = await generateReportRunId(service, reportJob?.job_id);
          break;
        case "mark-run-id-completed":
          logger.info("Marking run id as completed");
          const reportJobRunStatusService = new ReportRunStatusService();
          const runId = await reportJobRunStatusService.retrieveRunId();
          payload = await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.COMPLETED,
            run_message: "Report run completed",
          });
          break;
        default:
          throw new Error(`Invalid event type: ${event?.type}`);
      }
      callback(null, JSON.stringify(payload));
    }
  } catch (error: any) {
    console.error("Error processing event", error);
    callback(new Error(`Error processing event: ${error?.message}`));
  }
};
