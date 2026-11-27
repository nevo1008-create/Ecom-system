resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Controls traffic to the public application load balancer."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow public HTTP traffic."
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow the load balancer to reach ECS tasks."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-${var.environment}-ecs-sg"
  description = "Controls traffic to the ECS application task."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = aws_security_group.ecs.id
  description                  = "Allow frontend traffic only from the ALB."
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "ecs_all" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow ECS tasks to reach AWS, Docker Hub and the data server."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "data_server" {
  name        = "${var.project_name}-${var.environment}-data-sg"
  description = "Allows Kafka and MongoDB traffic only from ECS tasks."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-data-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "data_kafka_from_ecs" {
  security_group_id            = aws_security_group.data_server.id
  description                  = "Allow Kafka traffic from ECS tasks."
  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 9092
  to_port                      = 9092
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "data_mongodb_from_ecs" {
  security_group_id            = aws_security_group.data_server.id
  description                  = "Allow MongoDB traffic from ECS tasks."
  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 27017
  to_port                      = 27017
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "data_all" {
  security_group_id = aws_security_group.data_server.id
  description       = "Allow the data server to download images and reach AWS services."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
