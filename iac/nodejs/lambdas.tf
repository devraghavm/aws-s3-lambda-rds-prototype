# resource "aws_iam_role" "iam_for_lambda" {
#   name               = "data-data-ingest-lambda-role"
#   assume_role_policy = data.aws_iam_policy_document.assume_role.json
#   inline_policy {
#     name   = "DefaultPolicy"
#     policy = data.aws_iam_policy_document.lambda_role_policies.json
#   }
#   depends_on = [data.aws_iam_policy_document.assume_role, data.aws_iam_policy_document.lambda_role_policies]
# }

# data "archive_file" "data_ingest_lambda_zip" {
#   type        = "zip"
#   source_dir  = "${path.module}/../../src/nodejs/src/handlers/data-ingest-lambda/"
#   output_path = "${path.module}/../../src/nodejs/dist/data-ingest-lambda.zip"
# }

# resource "aws_lambda_function" "lambda" {
#   filename         = data.archive_file.data_ingest_lambda_zip.output_path
#   source_code_hash = data.archive_file.data_ingest_lambda_zip.output_base64sha256
#   function_name    = "data-ingest"
#   role             = aws_iam_role.iam_for_lambda.arn
#   handler          = "index.handler"
#   runtime          = "nodejs20.x"
#   timeout          = 15
#   vpc_config {
#     subnet_ids         = data.aws_subnets.default.ids
#     security_group_ids = [aws_security_group.lambda_sg.id]
#   }
#   environment {
#     variables = {
#       RDS_PROXY_ENDPOINT = aws_db_proxy.mssql_proxy.endpoint
#     }
#   }
#   layers = [
#     aws_lambda_layer_version.lambda_deps_layer.arn,
#     aws_lambda_layer_version.lambda_services_layer.arn
#   ]
#   depends_on = [
#     aws_iam_role.iam_for_lambda,
#     data.archive_file.data_ingest_lambda_zip,
#     aws_db_proxy.mssql_proxy
#   ]
# }

# resource "aws_sns_topic_subscription" "topic_subscription" {
#   topic_arn = aws_sns_topic.topic.arn
#   protocol  = "lambda"
#   endpoint  = aws_lambda_function.lambda.arn
# }

# resource "aws_lambda_permission" "apigw_lambda" {
#   statement_id  = "AllowExecutionFromSNS"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.lambda.arn
#   principal     = "sns.amazonaws.com"
#   source_arn    = aws_sns_topic.topic.arn
#   depends_on    = [aws_sns_topic.topic, aws_lambda_function.lambda]
# }


# data "aws_iam_policy_document" "assume_role" {
#   statement {
#     effect = "Allow"
#     principals {
#       type        = "Service"
#       identifiers = ["lambda.amazonaws.com"]
#     }
#     actions = ["sts:AssumeRole"]
#   }
# }

# data "aws_iam_policy_document" "lambda_role_policies" {
#   statement {
#     effect = "Allow"
#     actions = [
#       "logs:CreateLogGroup",
#       "logs:CreateLogStream",
#       "logs:PutLogEvents",
#     ]
#     resources = ["arn:aws:logs:*:*:*"]
#   }

#   statement {
#     effect = "Allow"
#     actions = [
#       "ec2:CreateNetworkInterface",
#       "ec2:DescribeNetworkInterfaces",
#       "ec2:DescribeSubnets",
#       "ec2:DeleteNetworkInterface",
#       "ec2:AssignPrivateIpAddresses",
#       "ec2:UnassignPrivateIpAddresses",
#       "secretsmanager:GetSecretValue"
#     ]
#     resources = [
#       "arn:aws:rds:*:*:*",
#       "arn:aws:ec2:*:*:*",
#       "arn:aws:secretsmanager:*:*:*"
#     ]
#   }

#   statement {
#     effect = "Allow"
#     actions = [
#       "s3:GetObject",
#     ]
#     resources = [
#       format("%s/%s*", aws_s3_bucket.cdle-report-data.arn, aws_s3_object.irs_folder.key)
#     ]
#   }

#   statement {
#     effect = "Allow"
#     actions = [
#       "s3:PutObject",
#     ]
#     resources = [
#       format("%s/%s*", aws_s3_bucket.cdle-report-data.arn, aws_s3_object.myui_folder.key)
#     ]
#   }
# }
