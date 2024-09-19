import { SNSEvent, Context, Callback } from "aws-lambda";
import logger from "../../layers/service-layer/config/logger.config";
import { ReportRunStatusService } from "../../layers/service-layer/service/report.run.status.service";
import { ReportJobRunStatus } from "../../layers/service-layer/enum/report.job.run.status";
import { IrsCompareService } from "../../layers/service-layer/service/irs.compare.service";

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
      switch (type) {
        case "trigger-compare":
          // Trigger compare
          logger.info("Triggering compare");
          const reportJobRunStatusService = new ReportRunStatusService();
          const runId = await reportJobRunStatusService.retrieveRunId();
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_COMPARE_STARTED,
            run_message: "IRS compare started",
          });
          const irsCompareService = new IrsCompareService();
          payload = await irsCompareService.compare(runId);
          await reportJobRunStatusService.insert({
            run_id: runId,
            run_status: ReportJobRunStatus.IRS_COMPARE_COMPLETED,
            run_message: "IRS compare completed",
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
