variable "project_name" {
  description = "Short name used to prefix/identify resources."
  type        = string
  default     = "freight-load-board"
}

variable "aws_region" {
  description = "AWS region for the S3 bucket. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = <<-EOT
    Globally-unique S3 bucket name for the site assets.
    Leave empty to auto-generate "<project_name>-<random suffix>".
  EOT
  type        = string
  default     = ""
}
