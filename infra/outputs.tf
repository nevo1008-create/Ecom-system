output "vpc_id" {
  description = "ID of the project VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets used by the load balancer."
  value = [
    for availability_zone in local.availability_zones :
    aws_subnet.public[availability_zone].id
  ]
}

output "private_subnet_ids" {
  description = "IDs of the private subnets used by ECS and the data server."
  value = [
    for availability_zone in local.availability_zones :
    aws_subnet.private[availability_zone].id
  ]
}

output "nat_gateway_id" {
  description = "ID of the NAT gateway used by the private subnets."
  value       = aws_nat_gateway.main.id
}

output "data_server_instance_id" {
  description = "ID of the EC2 instance running Kafka and MongoDB."
  value       = aws_instance.data_server.id
}

output "data_server_private_ip" {
  description = "Private IP address used to reach Kafka and MongoDB."
  value       = aws_instance.data_server.private_ip
}

output "alb_dns_name" {
  description = "Public DNS name of the application load balancer."
  value       = aws_lb.app.dns_name
}

output "frontend_target_group_arn" {
  description = "ARN of the target group used later by the ECS service."
  value       = aws_lb_target_group.frontend.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "Name of the ECS service."
  value       = aws_ecs_service.app.name
}
