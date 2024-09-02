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

resource "aws_s3_bucket" "cdle-lambda-archives" {
  bucket = "devraghavm-cdle-lambda-archives"
}

resource "aws_s3_object" "deps_zip" {
  bucket = aws_s3_bucket.cdle-lambda-archives.bucket
  key    = "layers/deps.zip"
  source = data.archive_file.deps_layer_code_zip.output_path
  etag   = data.archive_file.deps_layer_code_zip.output_base64sha256


  depends_on = [
    data.archive_file.deps_layer_code_zip,
  ]
}

resource "aws_s3_object" "services_zip" {
  bucket = aws_s3_bucket.cdle-lambda-archives.bucket
  key    = "layers/services.zip"
  source = data.archive_file.services_layer_code_zip.output_path
  etag   = data.archive_file.services_layer_code_zip.output_base64sha256


  depends_on = [
    data.archive_file.services_layer_code_zip,
  ]
}
