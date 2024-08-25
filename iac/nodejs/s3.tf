resource "aws_s3_bucket" "cdle-report-data" {
  bucket = "devraghavm-cdle-report-data" // Use unique name for your bucket
}

resource "aws_s3_object" "irs_folder" {
  bucket = aws_s3_bucket.cdle-report-data.bucket
  key    = "irs/"
}

resource "aws_s3_object" "myui_folder" {
  bucket = aws_s3_bucket.cdle-report-data.bucket
  key    = "myui/"
}

resource "aws_s3_bucket_notification" "irs_put_notification" {
  bucket = aws_s3_bucket.cdle-report-data.id

  topic {
    topic_arn = aws_sns_topic.topic.arn
    events    = ["s3:ObjectCreated:*"]
  }
}
