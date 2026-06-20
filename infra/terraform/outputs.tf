output "alb_dns_name" {
  description = "pError API ALB DNS"
  value       = aws_lb.api.dns_name
}

output "dashboard_bucket" {
  description = "Dashboard 정적 파일 업로드 대상 S3 버킷"
  value       = aws_s3_bucket.dashboard.bucket
}

output "dashboard_website_endpoint" {
  description = "S3 정적 웹사이트 엔드포인트"
  value       = aws_s3_bucket_website_configuration.dashboard.website_endpoint
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
}

output "demo_server_url" {
  description = "pError가 모니터링할 테스트용 Express 서버 URL"
  value       = var.enable_demo_server ? "http://${aws_lb.api.dns_name}:4100" : null
}
