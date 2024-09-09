variable "region" {
  description = "Default region of your resources"
  type        = string
  default     = "us-west-2" // Set as your default region here
}

variable "account_id" {
  description = "The ID of the default AWS account"
  type        = string
}
