variable "aws_region" {
  description = "AWS region where the infrastructure will be created."
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Name used to identify the project resources."
  type        = string
  default     = "yams-shells"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block used by the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks used by the two public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Exactly two public subnet CIDR blocks must be provided."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks used by the two private subnets."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Exactly two private subnet CIDR blocks must be provided."
  }
}

variable "data_server_instance_type" {
  description = "EC2 instance type used to run Kafka and MongoDB."
  type        = string
  default     = "t3.small"
}

variable "data_server_private_ip" {
  description = "Fixed private IP address used by the Kafka and MongoDB server."
  type        = string
  default     = "10.0.11.10"
}

variable "frontend_image" {
  description = "Docker image used by the frontend container."
  type        = string
  default     = "infinitynevo/yams-frontend:latest"
}

variable "client_server_image" {
  description = "Docker image used by the client server container."
  type        = string
  default     = "infinitynevo/yams-client-server:latest"
}

variable "api_server_image" {
  description = "Docker image used by the API server container."
  type        = string
  default     = "infinitynevo/yams-api-server:latest"
}

variable "ecs_desired_count" {
  description = "Number of application tasks that ECS should keep running."
  type        = number
  default     = 1
}
