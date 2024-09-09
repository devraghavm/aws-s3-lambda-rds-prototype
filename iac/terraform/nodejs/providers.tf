terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "devraghavm-terraform-cdle-report-certification" // Here is your state bucket
    key    = "report-certification/state"
  }
}

// Region is set from AWS_REGION environment variable
provider "aws" {
}
