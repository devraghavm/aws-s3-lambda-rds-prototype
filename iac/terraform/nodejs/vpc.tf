# Get Default VPC
data "aws_vpc" "default" {
  default = true
}

# Get Default Subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Create DB Subnet Group
resource "aws_db_subnet_group" "default" {
  name       = "rds-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "rds-subnet-group"
  }
}

# Create VPC Endpoint for Lambda
resource "aws_vpc_endpoint" "lambda_vpc_endpoint" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.region}.lambda"
  vpc_endpoint_type = "Interface"
  depends_on        = [aws_db_subnet_group.default]
}

# Create Security Group for RDS
resource "aws_security_group" "lambda_sg" {
  name        = "lambda_sg"
  description = "Allow access Lambda"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_proxy_sg" {
  name        = "rds_proxy_sg"
  description = "Allow access to RDS Proxy"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 1433
    to_port     = 1433
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 1433
    to_port   = 1433
    protocol  = "tcp"
    security_groups = [
      "${aws_security_group.lambda_sg.id}",
    ]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  depends_on = [aws_security_group.lambda_sg]
}

resource "aws_security_group" "rds_sg" {
  name        = "rds_sg"
  description = "Allow access to RDS Proxy"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port = 1433
    to_port   = 1433
    protocol  = "tcp"
    security_groups = [
      "${aws_security_group.rds_proxy_sg.id}",
    ]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  depends_on = [aws_security_group.rds_proxy_sg]
}


