output "s3_bucket" {
  description = "Name of the S3 bucket holding the site assets. Set as GitHub Actions variable S3_BUCKET."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID. Set as GitHub Actions variable CLOUDFRONT_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.site.id
}

output "site_url" {
  description = "Public HTTPS URL of the deployed app."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}
