data "archive_file" "deps_layer_code_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../src/nodejs/dist/layers/deps-layer/"
  output_path = "${path.module}/.terraform/archive_files/deps.zip"
}

data "archive_file" "services_layer_code_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../src/nodejs/src/layers/service-layer/"
  output_path = "${path.module}/.terraform/archive_files/services.zip"
}

data "archive_file" "data_ingest_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../src/nodejs/src/handlers/data-ingest-lambda/"
  output_path = "${path.module}/.terraform/archive_files/data-ingest-lambda.zip"
}
