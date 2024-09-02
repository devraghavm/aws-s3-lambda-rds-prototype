# resource "aws_lambda_layer_version" "lambda_deps_layer" {
#   layer_name = "shared_deps"

#   filename         = data.archive_file.deps_layer_code_zip.output_path
#   source_code_hash = data.archive_file.deps_layer_code_zip.output_base64sha256

#   compatible_runtimes = ["nodejs20.x"]
#   depends_on          = [data.archive_file.deps_layer_code_zip]
# }

# resource "aws_lambda_layer_version" "lambda_services_layer" {
#   layer_name = "shared_services"

#   filename         = data.archive_file.services_layer_code_zip.output_path
#   source_code_hash = data.archive_file.services_layer_code_zip.output_base64sha256

#   compatible_runtimes = ["nodejs20.x"]
#   depends_on          = [data.archive_file.services_layer_code_zip]
# }

# data "archive_file" "deps_layer_code_zip" {
#   type        = "zip"
#   source_dir  = "${path.module}/../../src/nodejs/dist/layers/deps-layer/"
#   output_path = "${path.module}/../../src/nodejs/dist/deps.zip"
# }

# data "archive_file" "services_layer_code_zip" {
#   type        = "zip"
#   source_dir  = "${path.module}/../../src/nodejs/src/layers/service-layer/"
#   output_path = "${path.module}/../../src/nodejs/dist/services.zip"
# }
