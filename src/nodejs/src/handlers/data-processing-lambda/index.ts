import { SNSEvent, Context, Callback } from "aws-lambda";
import logger from "../../layers/service-layer/config/logger.config";

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
      switch (type) {
        case "trigger-compare":
          // Trigger compare
          logger.info("Triggering compare");
          break;
        default:
          logger.error(`Unknown type: ${type}`);
          callback(new Error(`Unknown type: ${type}`));
      }
    }
  } catch (error: any) {
    console.error("Error processing event", error);
    callback(new Error(`Error processing event: ${error?.message}`));
  }
};
