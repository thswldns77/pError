variable "aws_region" {
  description = "AWS Academy 실습 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "리소스 이름 접두사"
  type        = string
  default     = "perror"
}

variable "github_repo_url" {
  description = "EC2 user-data가 내려받을 pError 저장소 URL"
  type        = string
}

variable "admin_password" {
  description = "pError 관리자 비밀번호"
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "관리자 토큰 서명용 secret"
  type        = string
  sensitive   = true
}

variable "instance_type" {
  description = "AWS Academy 비용 절감을 위한 EC2 인스턴스 타입"
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Auto Scaling Group 최소 인스턴스 수"
  type        = number
  default     = 2
}

variable "asg_desired_capacity" {
  description = "Auto Scaling Group 기본 인스턴스 수"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Auto Scaling Group 최대 인스턴스 수"
  type        = number
  default     = 4
}
