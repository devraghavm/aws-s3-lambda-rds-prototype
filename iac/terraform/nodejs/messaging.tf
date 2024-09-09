resource "aws_sns_topic" "topic" {
  name   = "report-events"
  policy = data.aws_iam_policy_document.sns-topic-policy.json
}

data "aws_iam_policy_document" "sns-topic-policy" {
  policy_id = "arn:aws:sns:${var.region}:${var.account_id}:report-events/SNSS3NotificationPolicy"
  statement {
    sid    = "s3-allow-send-messages"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    actions = [
      "SNS:Publish",
    ]
    resources = [
      "arn:aws:sns:${var.region}:${var.account_id}:report-events",
    ]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        aws_s3_bucket.cdle-report-data.arn
      ]
    }
  }
}
