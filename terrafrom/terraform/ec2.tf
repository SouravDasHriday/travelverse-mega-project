resource "aws_key_pair" "deployer" {
  key_name   = "terra-automate-key"
  public_key = file("../secrets/terra-key.pub")
}

resource "aws_default_vpc" "default" {
}

resource "aws_security_group" "travelverse_sg" {
  name        = "travelverse-sg"
  description = "Allow required ports for DevSecOps project"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SonarQube"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "App & K8s NodePorts"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outgoing traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "travelverse-security-group"
  }
}

resource "aws_instance" "master_node" {
  ami             = var.ami_id
  instance_type   = var.instance_type
  key_name        = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [
    aws_security_group.travelverse_sg.id
  ]
  tags = {
    Name = "Jenkins-Master-Node"
  }
  root_block_device {
    volume_size = 29
    volume_type = "gp3"
  }
}

resource "aws_instance" "worker_node" {
  ami             = var.ami_id
  instance_type   = var.instance_type
  key_name        = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [
    aws_security_group.travelverse_sg.id
  ]
  tags = {
    Name = "Jenkins-Worker-Node"
  }
  root_block_device {
    volume_size = 29
    volume_type = "gp3"
  }
}

output "master_public_ip" {
  value = aws_instance.master_node.public_ip
}

output "worker_public_ip" {
  value = aws_instance.worker_node.public_ip
}
