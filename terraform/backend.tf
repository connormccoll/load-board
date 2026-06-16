terraform {
  # Remote state in S3 with native lockfile (no DynamoDB needed).
  # bucket + region are overridden at init time via -backend-config in CI,
  # matching the existing inbox-aggregator setup.
  backend "s3" {
    bucket       = "load-board-tf-state"
    key          = "load-board/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
