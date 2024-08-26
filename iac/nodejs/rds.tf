resource "aws_db_proxy" "mssql_proxy" {
  name                   = "mssql-proxy"
  debug_logging          = false
  engine_family          = "SQLSERVER"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.iam_for_rds_proxy.arn
  vpc_subnet_ids         = data.aws_subnets.default.ids
  vpc_security_group_ids = [aws_security_group.rds_proxy_sg.id]
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.mssql_admin_credentials.arn
    iam_auth    = "REQUIRED"
    description = "Admin user"
  }
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.mssql_lambdauser_credentials.arn
    iam_auth    = "REQUIRED"
    description = "lambda user"
  }
  tags = {
    Name = "mssql-proxy"
  }

}

# Create IAM Role for RDS Proxy
resource "aws_iam_role" "iam_for_rds_proxy" {
  name               = "rds-proxy-role"
  assume_role_policy = data.aws_iam_policy_document.rds_proxy_assume_role.json
  inline_policy {
    name   = "DefaultPolicy"
    policy = data.aws_iam_policy_document.rds_proxy_role_policies.json
  }
}

data "aws_iam_policy_document" "rds_proxy_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "rds_proxy_role_policies" {
  statement {
    effect = "Allow"
    actions = [
      "secretmanager:GetSecretValue",
    ]
    resources = [
      aws_secretsmanager_secret.mssql_admin_credentials.arn,
      aws_secretsmanager_secret.mssql_lambdauser_credentials.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
    ]
    resources = [
      "arn:aws:kms:${var.region}:${var.account_id}:key/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.region}.amazonaws.com"]
    }
  }
}

# Create RDS Instance
resource "aws_db_instance" "mssql_instance" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "sqlserver-se"
  engine_version         = "16.00.4131.2.v1"
  instance_class         = "db.t3.xlarge"
  username               = jsondecode(aws_secretsmanager_secret_version.mssql_credentials_version.secret_string)["username"]
  password               = jsondecode(aws_secretsmanager_secret_version.mssql_credentials_version.secret_string)["password"]
  parameter_group_name   = "default.sqlserver-se-16.0"
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
}


