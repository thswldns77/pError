data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ec2_instance_type_offerings" "app" {
  location_type = "availability-zone"

  filter {
    name   = "instance-type"
    values = [var.instance_type]
  }
}

data "aws_subnets" "compute" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = data.aws_ec2_instance_type_offerings.app.locations
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "random_password" "db" {
  length  = 20
  special = false
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "pError public ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "pError API instances"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    to_port         = 4000
  }

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    protocol    = "-1"
    to_port     = 0
  }
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg"
  description = "pError RDS PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    to_port         = 5432
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  db_name                = "perror"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  engine                 = "postgres"
  engine_version         = "16"
  identifier             = "${var.project_name}-postgres"
  instance_class         = "db.t3.micro"
  password               = random_password.db.result
  publicly_accessible    = false
  skip_final_snapshot    = true
  storage_encrypted      = true
  username               = "perror"
  vpc_security_group_ids = [aws_security_group.db.id]
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/perror/api"
  retention_in_days = 7
}

resource "aws_lb" "api" {
  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-tg"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.api.arn
    type             = "forward"
  }
}

resource "aws_launch_template" "api" {
  name_prefix   = "${var.project_name}-api-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      delete_on_termination = true
      encrypted             = true
      volume_size           = var.ec2_root_volume_size
      volume_type           = "gp3"
    }
  }

  iam_instance_profile {
    name = var.ec2_instance_profile_name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
    admin_password  = var.admin_password
    auth_secret     = var.auth_secret
    database_url    = "postgresql://perror:${random_password.db.result}@${aws_db_instance.postgres.address}:5432/perror?schema=public"
    github_repo_url = var.github_repo_url
  }))
}

resource "aws_autoscaling_group" "api" {
  desired_capacity    = var.asg_desired_capacity
  max_size            = var.asg_max_size
  min_size            = var.asg_min_size
  target_group_arns   = [aws_lb_target_group.api.arn]
  vpc_zone_identifier = data.aws_subnets.compute.ids

  launch_template {
    id      = aws_launch_template.api.id
    version = aws_launch_template.api.latest_version
  }

  instance_refresh {
    strategy = "Rolling"

    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    propagate_at_launch = true
    value               = "${var.project_name}-api"
  }
}

resource "aws_autoscaling_policy" "cpu" {
  autoscaling_group_name = aws_autoscaling_group.api.name
  name                   = "${var.project_name}-cpu-target"
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 55
  }
}

resource "aws_s3_bucket" "dashboard" {
  bucket = "${var.project_name}-dashboard-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_website_configuration" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "dashboard" {
  block_public_acls       = false
  block_public_policy     = false
  bucket                  = aws_s3_bucket.dashboard.id
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "${aws_s3_bucket.dashboard.arn}/*"
    }]
    Version = "2012-10-17"
  })

  depends_on = [aws_s3_bucket_public_access_block.dashboard]
}
