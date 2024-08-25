# Store MSSQL Credentials in Secrets Manager
resource "aws_secretsmanager_secret" "mssql_admin_credentials" {
  name = "mssql_admin_credentials"
}

resource "aws_secretsmanager_secret_version" "mssql_admin_credentials_version" {
  secret_id = aws_secretsmanager_secret.mssql_admin_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = "password123"
  })
}

data "aws_kms_key" "by_alias" {
  key_id = "aws/secretsmanager"
}

resource "aws_secretsmanager_secret" "mssql_lambdauser_credentials" {
  name       = "mssql_lambda_credentials"
  kms_key_id = data.aws_kms_key.by_alias.arn
}

resource "aws_secretsmanager_secret_version" "mssql_lambdauser_credentials_version" {
  secret_id = aws_secretsmanager_secret.mssql_lambdauser_credentials.id
  secret_string = jsonencode({
    username = "lambdauser"
    password = "lambdapassword"
  })
}


