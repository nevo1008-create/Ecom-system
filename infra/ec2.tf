resource "aws_iam_role" "data_server" {
  name = "${var.project_name}-${var.environment}-data-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-data-server-role"
  }
}

resource "aws_iam_role_policy_attachment" "data_server_ssm" {
  role       = aws_iam_role.data_server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "data_server" {
  name = "${var.project_name}-${var.environment}-data-server-profile"
  role = aws_iam_role.data_server.name
}

data "aws_ssm_parameter" "amazon_linux_2023_ami" {
  name            = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
  with_decryption = false
}

resource "aws_instance" "data_server" {
  ami                         = nonsensitive(data.aws_ssm_parameter.amazon_linux_2023_ami.value)
  instance_type               = var.data_server_instance_type
  subnet_id                   = aws_subnet.private[local.availability_zones[0]].id
  private_ip                  = var.data_server_private_ip
  associate_public_ip_address = false
  vpc_security_group_ids      = [aws_security_group.data_server.id]
  iam_instance_profile        = aws_iam_instance_profile.data_server.name

  user_data = templatefile("${path.module}/user-data/data-server.sh.tftpl", {
    data_server_private_ip = var.data_server_private_ip
  })

  user_data_replace_on_change = true

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-data-server"
  }
}
