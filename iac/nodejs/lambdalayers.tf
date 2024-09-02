resource "aws_lambda_layer_version" "lambda_deps_layer" {
  layer_name       = "shared_deps"
  description      = "Shared dependencies for all lambdas"
  s3_bucket        = aws_s3_bucket.cdle-lambda-archives.bucket
  s3_key           = "layers/deps.zip"
  source_code_hash = data.archive_file.deps_layer_code_zip.output_base64sha256

  compatible_runtimes = ["nodejs20.x"]
  depends_on          = [data.archive_file.deps_layer_code_zip]
}

resource "aws_lambda_layer_version" "lambda_services_layer" {
  layer_name       = "shared_services"
  description      = "Shared services for all lambdas"
  s3_bucket        = aws_s3_bucket.cdle-lambda-archives.bucket
  s3_key           = "layers/services.zip"
  source_code_hash = data.archive_file.services_layer_code_zip.output_base64sha256

  compatible_runtimes = ["nodejs20.x"]
  depends_on          = [data.archive_file.services_layer_code_zip]
}
