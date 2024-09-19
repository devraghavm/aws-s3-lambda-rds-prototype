import { S3 } from "@aws-sdk/client-s3";
import { SNS } from "@aws-sdk/client-sns";
import { SNSEvent, Context, Callback } from "aws-lambda";
import logger from "../../layers/service-layer/config/logger.config";
import { ReportRunStatusService } from "../../layers/service-layer/service/report.run.status.service";
import { ReportJobRunStatus } from "../../layers/service-layer/enum/report.job.run.status";
import { IrsCompareService } from "../../layers/service-layer/service/irs.compare.service";

const s3 = new S3({
  region: "us-west-2",
});
const sns = new SNS({
  region: "us-west-2",
});

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
    console.log("Received event", JSON.stringify(event, null, 2));
    // Process SNS event
    if (event.Records && event.Records[0].Sns) {
      const snsEvent = event as SNSEvent;
      const snsMessage = JSON.parse(snsEvent.Records[0].Sns.Message);
      console.log("Received SNS message", JSON.stringify(snsMessage, null, 2));
      const { type } = snsMessage;
      logger.info(`Processing type: ${type}`);
      let payload;
      const irsCompareService = new IrsCompareService();
      const reportJobRunStatusService = new ReportRunStatusService();
      const runId = await reportJobRunStatusService.retrieveRunId();
      switch (type) {
        case "trigger-compare":
          // Trigger compare
          logger.info("Triggering compare");
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_COMPARE_STARTED,
            run_message: "IRS compare started",
          });
          await irsCompareService.compare(runId);
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_COMPARE_COMPLETED,
            run_message: "IRS compare completed",
          });
          const isCompareCompleted =
            await reportJobRunStatusService.isCompareCompleted(runId);
          if (isCompareCompleted) {
            await reportJobRunStatusService.insert({
              run_id: runId,
              run_status: ReportJobRunStatus.IRS_REPORT_INITIATED,
              run_message: "Report generation initiated",
            });
            // fire an SNS event to trigger the next stage
            const snsParams = {
              Message: JSON.stringify({
                type: "generate-report",
              }),
              TopicArn: process.env.SNS_TOPIC_ARN,
            };
            await sns.publish(snsParams);
          }
          payload = {
            message: "Compare completed successfully",
          };
          break;
        case "generate-report":
          // Generate report
          logger.info("Generating report");
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_REPORT_STARTED,
            run_message: "Report generation started",
          });
          const irsEmployerCompareDatas =
            await irsCompareService.readByRunId(runId);
          const csv = await irsCompareService.generateCsv(
            irsEmployerCompareDatas,
          );
          const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `report/${runId}.csv`,
            Body: csv,
          };
          await s3.putObject(s3Params);
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_REPORT_COMPLETED,
            run_message: "Report generation completed",
          });
          payload = {
            message: "Report generated successfully",
          };
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.COMPLETED,
            run_message: "Report job completed",
          });
          break;
        default:
          logger.error(`Unknown type: ${type}`);
          callback(new Error(`Unknown type: ${type}`));
      }
      callback(null, JSON.stringify(payload));
    }
  } catch (error: any) {
    console.error("Error processing event", error);
    callback(new Error(`Error processing event: ${error?.message}`));
  }
};
