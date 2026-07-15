variable "aws_region" {
  description = "AWS region where resources will be provisioned"
  default     = "ap-southeast-1"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID for the selected region"
  default     = "ami-03acbba64aef9bf5c" 
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  default     = "t2.large"
}
