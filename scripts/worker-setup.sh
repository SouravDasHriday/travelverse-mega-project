#!/bin/bash
# Worker Node Setup Script

echo "Updating system..."
sudo apt update -y

echo "Installing Java (Required for Jenkins Agent)..."
sudo apt install fontconfig openjdk-21-jre -y

echo "Installing Docker..."
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
#newgrp docker
sudo systemctl enable docker
sudo systemctl start docker

echo "Providing Permissions to Docker Socket (For Jenkins Pipeline)..."
sudo chmod 777 /var/run/docker.sock

echo "Installing AWS CLI v2..."
sudo apt install unzip -y
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

echo "Installing Trivy..."
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update -y
sudo apt-get install trivy -y

echo "Worker Setup Complete!"
