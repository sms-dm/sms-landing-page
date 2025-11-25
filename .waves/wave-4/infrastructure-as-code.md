# Infrastructure as Code Implementation Guide

## Overview

This guide provides production-ready Terraform configurations for deploying the SMS cloud infrastructure on AWS. All code is modular, reusable, and follows best practices for security and scalability.

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── prod/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.tf
│   │   ├── staging/
│   │   └── dev/
│   ├── modules/
│   │   ├── vpc/
│   │   ├── security/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── s3/
│   │   ├── cloudfront/
│   │   ├── monitoring/
│   │   └── backup/
│   └── global/
│       ├── iam/
│       ├── route53/
│       └── acm/
├── scripts/
│   ├── deploy.sh
│   ├── destroy.sh
│   └── validate.sh
└── docs/
    └── runbooks/
```

## 1. Backend Configuration

### terraform/environments/prod/backend.tf
```hcl
terraform {
  backend "s3" {
    bucket         = "sms-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "sms-terraform-locks"
    
    # Role-based access for state file
    role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformStateRole"
  }
  
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "SMS"
      ManagedBy   = "Terraform"
      CostCenter  = var.cost_center
    }
  }
}

# DR Region Provider
provider "aws" {
  alias  = "dr"
  region = var.dr_region
}
```

## 2. VPC Module

### terraform/modules/vpc/main.tf
```hcl
# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project}-${var.environment}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.project}-${var.environment}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project}-${var.environment}-public-${var.availability_zones[count.index]}"
    Type = "public"
  }
}

# Private Subnets - Application
resource "aws_subnet" "private_app" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.project}-${var.environment}-private-app-${var.availability_zones[count.index]}"
    Type = "private-app"
  }
}

# Private Subnets - Database
resource "aws_subnet" "private_db" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.project}-${var.environment}-private-db-${var.availability_zones[count.index]}"
    Type = "private-db"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"
  
  tags = {
    Name = "${var.project}-${var.environment}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.project}-${var.environment}-nat-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "private_db" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  
  tags = {
    Name = "${var.project}-${var.environment}-s3-endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  
  tags = {
    Name = "${var.project}-${var.environment}-ecr-endpoint"
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project}-${var.environment}-vpc-endpoints-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-vpc-endpoints-sg"
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = {
    Name = "${var.project}-${var.environment}-flow-logs"
  }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/${var.project}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = var.kms_key_arn
}

resource "aws_iam_role" "flow_logs" {
  name_prefix = "${var.project}-${var.environment}-flow-logs-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  role = aws_iam_role.flow_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}
```

### terraform/modules/vpc/variables.tf
```hcl
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = ""
}
```

### terraform/modules/vpc/outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```

## 3. ECS Module

### terraform/modules/ecs/main.tf
```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-cluster"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "${var.project}-${var.environment}-ecs-task-execution-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional permissions for Secrets Manager
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  role = aws_iam_role.ecs_task_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/*",
          var.kms_key_arn
        ]
      }
    ]
  })
}

# Task Role (for application permissions)
resource "aws_iam_role" "ecs_task" {
  name_prefix = "${var.project}-${var.environment}-ecs-task-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# S3 access for tasks
resource "aws_iam_role_policy" "ecs_task_s3" {
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project}-*/*",
          "arn:aws:s3:::${var.project}-*"
        ]
      }
    ]
  })
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "ecs" {
  for_each = toset(var.services)
  
  name              = "/ecs/${var.project}-${var.environment}/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn
  
  tags = {
    Name        = "${var.project}-${var.environment}-${each.key}-logs"
    Service     = each.key
    Environment = var.environment
  }
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.environment}.${var.project}.local"
  description = "Private DNS namespace for ${var.project} ${var.environment}"
  vpc         = var.vpc_id
  
  tags = {
    Name = "${var.project}-${var.environment}-service-discovery"
  }
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project}-${var.environment}-alb-"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-alb-sg"
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project}-${var.environment}-ecs-tasks-"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow inbound from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-ecs-tasks-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true
  
  tags = {
    Name = "${var.project}-${var.environment}-alb"
  }
}

# ALB Target Group for API
resource "aws_lb_target_group" "api" {
  name                 = "${var.project}-${var.environment}-api"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-api-tg"
  }
}

# ALB Listener (HTTP redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ALB Listener (HTTPS)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs_target" {
  for_each = var.service_configs
  
  max_capacity       = each.value.max_count
  min_capacity       = each.value.min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${each.key}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  depends_on = [aws_ecs_service.main]
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  for_each = var.service_configs
  
  name               = "${var.project}-${var.environment}-${each.key}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[each.key].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = each.value.cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  for_each = var.service_configs
  
  name               = "${var.project}-${var.environment}-${each.key}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[each.key].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = each.value.memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ECR Repositories
resource "aws_ecr_repository" "main" {
  for_each = toset(var.services)
  
  name                 = "${var.project}-${var.environment}-${each.key}"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = var.kms_key_arn
  }
  
  tags = {
    Name        = "${var.project}-${var.environment}-${each.key}"
    Service     = each.key
    Environment = var.environment
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "main" {
  for_each   = aws_ecr_repository.main
  repository = each.value.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
```

### terraform/modules/ecs/task-definitions.tf
```hcl
# API Service Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.environment}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.service_configs["api"].cpu
  memory                   = var.service_configs["api"].memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${aws_ecr_repository.main["api"].repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/database-url"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/jwt-secret"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/redis-url"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs["api"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      essential = true
    }
  ])
  
  tags = {
    Name        = "${var.project}-${var.environment}-api-task"
    Service     = "api"
    Environment = var.environment
  }
}

# ECS Service for API
resource "aws_ecs_service" "main" {
  for_each = var.service_configs
  
  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = each.key == "api" ? aws_ecs_task_definition.api.arn : aws_ecs_task_definition.worker.arn
  desired_count   = each.value.desired_count
  launch_type     = "FARGATE"
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
    
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  dynamic "load_balancer" {
    for_each = each.key == "api" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.api.arn
      container_name   = "api"
      container_port   = 3000
    }
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.main[each.key].arn
  }
  
  tags = {
    Name        = "${var.project}-${var.environment}-${each.key}-service"
    Service     = each.key
    Environment = var.environment
  }
  
  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy.ecs_task_execution_secrets
  ]
}

# Service Discovery
resource "aws_service_discovery_service" "main" {
  for_each = var.service_configs
  
  name = each.key
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 60
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_custom_config {
    failure_threshold = 1
  }
}

# Worker Task Definition
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project}-${var.environment}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.service_configs["worker"].cpu
  memory                   = var.service_configs["worker"].memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "worker"
      image = "${aws_ecr_repository.main["worker"].repository_url}:latest"
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "WORKER_TYPE"
          value = "queue-processor"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/database-url"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/redis-url"
        },
        {
          name      = "SQS_QUEUE_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/sqs-queue-url"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs["worker"].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      essential = true
    }
  ])
  
  tags = {
    Name        = "${var.project}-${var.environment}-worker-task"
    Service     = "worker"
    Environment = var.environment
  }
}
```

## 4. RDS Module

### terraform/modules/rds/main.tf
```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name = "${var.project}-${var.environment}-db-subnet-group"
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.project}-${var.environment}-pg14"
  family = "postgres14"
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pgaudit"
  }
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries longer than 1 second
  }
  
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
  
  parameter {
    name  = "max_connections"
    value = "200"
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-db-params"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-${var.environment}-rds-"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    description     = "PostgreSQL access from application"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-rds-sg"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project}-${var.environment}"
  
  # Engine
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class
  
  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_arn
  
  # Database
  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result
  port     = 5432
  
  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High Availability
  multi_az               = var.multi_az
  availability_zone      = var.multi_az ? null : var.availability_zone
  
  # Backup
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_monitoring.arn
  
  # Other
  parameter_group_name         = aws_db_parameter_group.main.name
  deletion_protection          = var.environment == "prod" ? true : false
  skip_final_snapshot          = var.environment == "prod" ? false : true
  final_snapshot_identifier    = var.environment == "prod" ? "${var.project}-${var.environment}-final-${timestamp()}" : null
  apply_immediately           = var.environment != "prod"
  
  tags = {
    Name = "${var.project}-${var.environment}-rds"
  }
}

# Generate random password for RDS
resource "random_password" "master" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name_prefix = "${var.project}/${var.environment}/db-master-password-"
  kms_key_id  = var.kms_key_arn
  
  tags = {
    Name = "${var.project}-${var.environment}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.master.result
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.project}-${var.environment}-rds-monitoring-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Read Replicas
resource "aws_db_instance" "read_replica" {
  count = var.read_replica_count
  
  identifier = "${var.project}-${var.environment}-read-${count.index + 1}"
  
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.read_replica_instance_class
  
  # Disable backups on read replicas
  backup_retention_period = 0
  
  # Monitoring
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name = "${var.project}-${var.environment}-read-replica-${count.index + 1}"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project}-${var.environment}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [var.sns_topic_arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project}-${var.environment}-rds-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [var.sns_topic_arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

# Database connection string secret
resource "aws_secretsmanager_secret" "db_connection_string" {
  name_prefix = "${var.project}/${var.environment}/database-url-"
  kms_key_id  = var.kms_key_arn
  
  tags = {
    Name = "${var.project}-${var.environment}-db-connection-string"
  }
}

resource "aws_secretsmanager_secret_version" "db_connection_string" {
  secret_id = aws_secretsmanager_secret.db_connection_string.id
  secret_string = jsonencode({
    url = "postgresql://${var.master_username}:${random_password.master.result}@${aws_db_instance.main.endpoint}/${var.database_name}?sslmode=require"
  })
}
```

## 5. S3 Module

### terraform/modules/s3/main.tf
```hcl
# S3 Buckets
resource "aws_s3_bucket" "main" {
  for_each = var.buckets
  
  bucket = "${var.project}-${each.key}-${var.environment}-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(
    {
      Name        = "${var.project}-${each.key}-${var.environment}"
      Environment = var.environment
      Purpose     = each.key
    },
    var.tags
  )
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  for_each = var.buckets
  
  bucket = aws_s3_bucket.main[each.key].id
  
  versioning_configuration {
    status = each.value.versioning ? "Enabled" : "Disabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = var.buckets
  
  bucket = aws_s3_bucket.main[each.key].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

# Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = var.buckets
  
  bucket = aws_s3_bucket.main[each.key].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket Lifecycle Rules
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = { for k, v in var.buckets : k => v if v.lifecycle_rules != null }
  
  bucket = aws_s3_bucket.main[each.key].id
  
  dynamic "rule" {
    for_each = each.value.lifecycle_rules
    
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"
      
      dynamic "transition" {
        for_each = rule.value.transitions
        
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }
      
      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        
        content {
          days = rule.value.expiration_days
        }
      }
      
      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration_days != null ? [1] : []
        
        content {
          noncurrent_days = rule.value.noncurrent_version_expiration_days
        }
      }
    }
  }
}

# CORS Configuration for user uploads bucket
resource "aws_s3_bucket_cors_configuration" "uploads" {
  count = contains(keys(var.buckets), "uploads") ? 1 : 0
  
  bucket = aws_s3_bucket.main["uploads"].id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "cdn_policy" {
  count = contains(keys(var.buckets), "static") ? 1 : 0
  
  bucket = aws_s3_bucket.main["static"].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main["static"].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_distribution_arn
          }
        }
      }
    ]
  })
}

# S3 Bucket Notification Configuration
resource "aws_s3_bucket_notification" "uploads" {
  count = contains(keys(var.buckets), "uploads") && var.enable_upload_notifications ? 1 : 0
  
  bucket = aws_s3_bucket.main["uploads"].id
  
  lambda_function {
    lambda_function_arn = var.upload_processor_lambda_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "incoming/"
  }
  
  depends_on = [aws_lambda_permission.allow_s3]
}

# Lambda permission for S3
resource "aws_lambda_permission" "allow_s3" {
  count = contains(keys(var.buckets), "uploads") && var.enable_upload_notifications ? 1 : 0
  
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = var.upload_processor_lambda_arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.main["uploads"].arn
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}
```

## 6. Monitoring Module

### terraform/modules/monitoring/main.tf
```hcl
# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name              = "${var.project}-${var.environment}-alarms"
  kms_master_key_id = var.kms_key_arn
  
  tags = {
    Name = "${var.project}-${var.environment}-alarms"
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.environment}-overview"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project}-api", "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Service Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_name],
            [".", "RequestCount", ".", ".", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Load Balancer Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", ".", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

# Application Insights
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project}-${var.environment}-error-count"
  log_group_name = var.api_log_group_name
  pattern        = "[time, request_id, event_type=ERROR*, ...]"
  
  metric_transformation {
    name      = "ErrorCount"
    namespace = "${var.project}/${var.environment}"
    value     = "1"
  }
}

# Custom Metrics Alarms
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "${var.project}/${var.environment}"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "Triggers when error rate is high"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
}

# Synthetic Monitoring
resource "aws_synthetics_canary" "api_health" {
  name                 = "${var.project}-${var.environment}-api-health"
  artifact_s3_location = "s3://${var.monitoring_bucket}/canary-artifacts/"
  execution_role_arn   = aws_iam_role.canary.arn
  handler              = "apiCanary.handler"
  zip_file             = data.archive_file.canary_code.output_path
  runtime_version      = "syn-nodejs-puppeteer-3.8"
  
  schedule {
    expression = "rate(5 minutes)"
  }
  
  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
  }
  
  success_retention_period = 7
  failure_retention_period = 7
  
  tags = {
    Name = "${var.project}-${var.environment}-api-canary"
  }
}

# IAM Role for Canary
resource "aws_iam_role" "canary" {
  name_prefix = "${var.project}-${var.environment}-canary-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "canary_policy" {
  role       = aws_iam_role.canary.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
}

# Archive file for canary code
data "archive_file" "canary_code" {
  type        = "zip"
  output_path = "/tmp/canary.zip"
  
  source {
    content  = file("${path.module}/canary/apiCanary.js")
    filename = "nodejs/node_modules/apiCanary.js"
  }
}

# Cost Anomaly Detection
resource "aws_ce_anomaly_monitor" "main" {
  name              = "${var.project}-${var.environment}-cost-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "main" {
  name      = "${var.project}-${var.environment}-cost-alerts"
  threshold = 100.0
  frequency = "DAILY"
  
  monitor_arn_list = [
    aws_ce_anomaly_monitor.main.arn
  ]
  
  subscriber {
    type    = "EMAIL"
    address = var.cost_alert_email
  }
}
```

## 7. Security Module

### terraform/modules/security/main.tf
```hcl
# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "${var.project} ${var.environment} encryption key"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project}-${var.environment}-kms"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project}-${var.environment}-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project}-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project}-${var.environment}-common-rules"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL injection protection
  rule {
    name     = "SQLiProtection"
    priority = 3
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project}-${var.environment}-sqli-protection"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-waf"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true
  
  datasources {
    s3_logs {
      enable = true
    }
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-guardduty"
  }
}

# Security Hub
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.2.0"
  
  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
  
  depends_on = [aws_securityhub_account.main]
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "${var.project}-${var.environment}-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${var.project}-*/*"]
    }
  }
  
  tags = {
    Name = "${var.project}-${var.environment}-cloudtrail"
  }
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# S3 bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project}-cloudtrail-${var.environment}-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.project}-${var.environment}-cloudtrail"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project}-${var.environment}"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project}-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config.bucket
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_delivery_channel.main]
}

# IAM Role for Config
resource "aws_iam_role" "config" {
  name_prefix = "${var.project}-${var.environment}-config-"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${var.project}-config-${var.environment}-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.project}-${var.environment}-config"
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}
```

## 8. Production Environment Configuration

### terraform/environments/prod/main.tf
```hcl
locals {
  environment = "prod"
  project     = "sms"
  aws_region  = "us-east-1"
  dr_region   = "eu-west-1"
  
  availability_zones = [
    "${local.aws_region}a",
    "${local.aws_region}b",
    "${local.aws_region}c"
  ]
  
  tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"
  
  project            = local.project
  environment        = local.environment
  aws_region         = local.aws_region
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = local.availability_zones
  enable_nat_gateway = true
  kms_key_arn       = module.security.kms_key_arn
}

# Security Module
module "security" {
  source = "../../modules/security"
  
  project              = local.project
  environment          = local.environment
  aws_region           = local.aws_region
  alb_arn             = module.ecs.alb_arn
  kms_deletion_window = 30
}

# RDS Module
module "rds" {
  source = "../../modules/rds"
  
  project                     = local.project
  environment                 = local.environment
  vpc_id                      = module.vpc.vpc_id
  subnet_ids                  = module.vpc.private_db_subnet_ids
  allowed_security_groups     = [module.ecs.ecs_tasks_security_group_id]
  kms_key_arn                = module.security.kms_key_arn
  
  engine_version              = "14.7"
  instance_class              = "db.r6g.xlarge"
  allocated_storage           = 500
  max_allocated_storage       = 1000
  multi_az                    = true
  backup_retention_period     = 7
  backup_window              = "03:00-04:00"
  maintenance_window         = "sun:04:00-sun:05:00"
  
  database_name              = "sms_production"
  master_username            = "sms_admin"
  
  read_replica_count         = 2
  read_replica_instance_class = "db.r6g.large"
  
  sns_topic_arn             = module.monitoring.sns_topic_arn
}

# ElastiCache Module
module "elasticache" {
  source = "../../modules/elasticache"
  
  project                 = local.project
  environment             = local.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_app_subnet_ids
  allowed_security_groups = [module.ecs.ecs_tasks_security_group_id]
  
  node_type               = "cache.r6g.large"
  number_cache_clusters   = 3
  automatic_failover      = true
  multi_az                = true
  
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"
  
  sns_topic_arn          = module.monitoring.sns_topic_arn
}

# S3 Module
module "s3" {
  source = "../../modules/s3"
  
  project     = local.project
  environment = local.environment
  kms_key_arn = module.security.kms_key_arn
  
  buckets = {
    static = {
      versioning = true
      lifecycle_rules = [
        {
          id      = "transition-to-ia"
          enabled = true
          transitions = [
            {
              days          = 90
              storage_class = "STANDARD_IA"
            }
          ]
          expiration_days                    = null
          noncurrent_version_expiration_days = 180
        }
      ]
    }
    uploads = {
      versioning = true
      lifecycle_rules = [
        {
          id      = "intelligent-tiering"
          enabled = true
          transitions = [
            {
              days          = 0
              storage_class = "INTELLIGENT_TIERING"
            }
          ]
          expiration_days                    = null
          noncurrent_version_expiration_days = 90
        }
      ]
    }
    backups = {
      versioning = false
      lifecycle_rules = [
        {
          id      = "archive-old-backups"
          enabled = true
          transitions = [
            {
              days          = 30
              storage_class = "GLACIER"
            }
          ]
          expiration_days                    = 365
          noncurrent_version_expiration_days = null
        }
      ]
    }
  }
  
  allowed_origins = [
    "https://app.sms-offshore.com",
    "https://onboarding.sms-offshore.com"
  ]
  
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
  enable_upload_notifications = true
  upload_processor_lambda_arn = module.lambda.upload_processor_arn
  
  tags = local.tags
}

# ECS Module
module "ecs" {
  source = "../../modules/ecs"
  
  project              = local.project
  environment          = local.environment
  aws_region           = local.aws_region
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  private_subnet_ids   = module.vpc.private_app_subnet_ids
  kms_key_arn         = module.security.kms_key_arn
  certificate_arn     = data.aws_acm_certificate.main.arn
  
  services = ["api", "worker", "frontend"]
  
  service_configs = {
    api = {
      cpu               = "1024"
      memory            = "2048"
      desired_count     = 3
      min_count        = 2
      max_count        = 20
      cpu_threshold    = 70
      memory_threshold = 80
    }
    worker = {
      cpu               = "1024"
      memory            = "2048"
      desired_count     = 2
      min_count        = 1
      max_count        = 10
      cpu_threshold    = 70
      memory_threshold = 80
    }
    frontend = {
      cpu               = "256"
      memory            = "512"
      desired_count     = 3
      min_count        = 2
      max_count        = 15
      cpu_threshold    = 70
      memory_threshold = 80
    }
  }
  
  log_retention_days = 30
}

# CloudFront Module
module "cloudfront" {
  source = "../../modules/cloudfront"
  
  project          = local.project
  environment      = local.environment
  s3_bucket_domain = module.s3.bucket_regional_domain_names["static"]
  alb_domain_name  = module.ecs.alb_dns_name
  certificate_arn  = data.aws_acm_certificate.cloudfront.arn
  waf_acl_id      = module.security.waf_acl_id
  
  custom_domain    = "app.sms-offshore.com"
  
  cache_behaviors = {
    "/api/*" = {
      target_origin_id       = "alb"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      compress              = true
      viewer_protocol_policy = "redirect-to-https"
      cache_policy_id       = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Disabled caching
      origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # All viewer headers
    }
    "/static/*" = {
      target_origin_id       = "s3"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      compress              = true
      viewer_protocol_policy = "redirect-to-https"
      cache_policy_id       = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
    }
  }
}

# Monitoring Module
module "monitoring" {
  source = "../../modules/monitoring"
  
  project             = local.project
  environment         = local.environment
  aws_region          = local.aws_region
  kms_key_arn        = module.security.kms_key_arn
  
  ecs_cluster_name    = module.ecs.cluster_name
  alb_name           = module.ecs.alb_name
  rds_instance_id    = module.rds.instance_id
  api_log_group_name = "/ecs/${local.project}-${local.environment}/api"
  monitoring_bucket  = module.s3.bucket_names["backups"]
  
  alarm_email        = var.alarm_email
  cost_alert_email   = var.cost_alert_email
}

# Data sources
data "aws_acm_certificate" "main" {
  domain   = "*.sms-offshore.com"
  statuses = ["ISSUED"]
}

data "aws_acm_certificate" "cloudfront" {
  provider = aws.us-east-1  # CloudFront requires us-east-1 certificates
  domain   = "*.sms-offshore.com"
  statuses = ["ISSUED"]
}

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}
```

### terraform/environments/prod/variables.tf
```hcl
variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  sensitive   = true
}

variable "cost_alert_email" {
  description = "Email address for cost anomaly alerts"
  type        = string
  sensitive   = true
}

variable "allowed_account_ids" {
  description = "List of allowed AWS account IDs"
  type        = list(string)
  default     = []
}
```

### terraform/environments/prod/outputs.tf
```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.ecs.alb_dns_name
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.elasticache.primary_endpoint_address
  sensitive   = true
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value       = module.ecs.ecr_repository_urls
}

output "s3_buckets" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}
```

## 9. Deployment Scripts

### scripts/deploy.sh
```bash
#!/bin/bash
set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying SMS Infrastructure - Environment: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or prod${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

# Navigate to environment directory
cd "${PROJECT_ROOT}/terraform/environments/${ENVIRONMENT}"

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init -upgrade

# Validate configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate

# Generate plan
echo -e "${YELLOW}Generating deployment plan...${NC}"
terraform plan -out=tfplan

# Show plan summary
terraform show -no-color tfplan | grep -E "^  # |^Plan:"

# Confirm deployment
read -p "Do you want to apply this plan? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Apply configuration
echo -e "${YELLOW}Applying Terraform configuration...${NC}"
terraform apply tfplan

# Clean up plan file
rm -f tfplan

# Output important values
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Key outputs:${NC}"
terraform output -json | jq -r 'to_entries[] | "\(.key): \(.value.value)"'

# Post-deployment tasks
echo -e "${YELLOW}Running post-deployment tasks...${NC}"

# Tag the deployment
git tag -a "${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)" -m "Deployed ${ENVIRONMENT} infrastructure"

echo -e "${GREEN}Infrastructure deployment successful!${NC}"
```

### scripts/validate.sh
```bash
#!/bin/bash
set -euo pipefail

# Validate all Terraform configurations
PROJECT_ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "Validating Terraform configurations..."

# Check formatting
echo "Checking Terraform formatting..."
terraform fmt -check -recursive "${PROJECT_ROOT}/terraform"

# Validate each module
for module in "${PROJECT_ROOT}"/terraform/modules/*/; do
    if [ -d "$module" ]; then
        echo "Validating module: $(basename "$module")"
        terraform init -backend=false "$module"
        terraform validate "$module"
    fi
done

# Validate environments
for env in dev staging prod; do
    echo "Validating environment: $env"
    cd "${PROJECT_ROOT}/terraform/environments/${env}"
    terraform init -backend=false
    terraform validate
done

echo "All validations passed!"
```

## 10. GitOps Configuration

### .github/workflows/terraform.yml
```yaml
name: Terraform CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  pull_request:
    branches: [main]
    paths:
      - 'terraform/**'

env:
  TF_VERSION: '1.5.0'
  AWS_REGION: 'us-east-1'

jobs:
  validate:
    name: Validate Terraform
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
      
      - name: Validate Modules
        run: |
          for module in terraform/modules/*/; do
            echo "Validating $module"
            terraform -chdir="$module" init -backend=false
            terraform -chdir="$module" validate
          done

  plan:
    name: Plan Infrastructure Changes
    runs-on: ubuntu-latest
    needs: validate
    if: github.event_name == 'pull_request'
    
    strategy:
      matrix:
        environment: [dev, staging, prod]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets[format('AWS_ROLE_{0}', matrix.environment)] }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Terraform Init
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform init
      
      - name: Terraform Plan
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform plan -no-color
        continue-on-error: true
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const output = `#### Terraform Plan - ${{ matrix.environment }} 
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  deploy:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    
    strategy:
      matrix:
        environment: [dev, staging]
        # Production requires manual approval
    
    environment: ${{ matrix.environment }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets[format('AWS_ROLE_{0}', matrix.environment)] }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Terraform Init
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform init
      
      - name: Terraform Apply
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform apply -auto-approve
```

## Summary

This Infrastructure as Code implementation provides:

1. **Modular Design**: Reusable modules for all infrastructure components
2. **Environment Separation**: Distinct configurations for dev, staging, and production
3. **Security First**: KMS encryption, WAF, GuardDuty, and comprehensive security controls
4. **High Availability**: Multi-AZ deployments, auto-scaling, and disaster recovery
5. **Cost Optimization**: Reserved instances, intelligent tiering, and cost monitoring
6. **GitOps Ready**: CI/CD pipelines for automated validation and deployment
7. **Monitoring**: Comprehensive CloudWatch dashboards and alerting
8. **Compliance**: CloudTrail, Config, and Security Hub for audit trails

The infrastructure is designed to scale from pilot deployment (3-5 vessels) to full production (100+ vessels) while maintaining security, performance, and cost efficiency.