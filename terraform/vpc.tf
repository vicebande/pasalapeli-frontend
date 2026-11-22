# VPC and Network Configuration

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-igw"
  }
}

# Public Subnets (para frontend/ALB)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id          = aws_vpc.main.id
  cidr_block      = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-public-subnet-${count.index}"
    SubnetType  = "public"
  }
}

# Private Subnets (para backend/BBDD)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id          = aws_vpc.main.id
  cidr_block      = "10.1.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-private-subnet-${count.index}"
    SubnetType  = "private"
  }
}

# NAT Gateway (para acceso saliente a internet desde subnets privadas)
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-nat-gateway"
  }
}

# EIP for NAT Gateway
resource "aws_eip" "nat" {
  vpc_id = aws_vpc.main.id
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-nat-eip"
  }
}

# Route Table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-public-route-table"
  }
}

# Associate route tables with subnets
resource "aws_route_table_association" "public" {
  count             = 2
  subnet_id       = aws_subnet.public[count.index].id
  route_table_id  = aws_route_table.public.id
}

# Associate route tables with private subnets
resource "aws_route_table_association" "private" {
  count             = 2
  subnet_id         = aws_subnet.private[count.index].id
  route_table_id    = aws_route_table.private.id
}

# Private route table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-private-route-table"
  }
}

# NAT routes for private subnets
resource "aws_route" "nat" {
  route_table_id          = aws_route_table.private.id
  destination_cidr_block  = "0.0.0.0/0"
  nat_gateway_id        = aws_nat_gateway.nat.id
}

# ============================================================
# SECURITY GROUPS
# ============================================================

# Frontend Security Group (HTTP/HTTPS from anywhere)
resource "aws_security_group" "frontend" {
  name        = "pasalapeli-frontend-sg"
  description = "Security group for frontend ALB"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-frontend-sg"
  }
}

# Backend Security Group (only from frontend SG and other private services)
resource "aws_security_group" "backend" {
  name        = "pasalapeli-backend-sg"
  description = "Security group for backend services"
  vpc_id      = aws_vpc.main.id
  
  # Allow traffic from frontend SG
  ingress {
    from_port       = 8080
    to_port       = 8080
    protocol    = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }
  
  ingress {
    from_port       = 8082
    to_port       = 8082
    protocol    = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }
  
  ingress {
    from_port       = 3306
    to_port       = 3306
    protocol    = "tcp"
    cidr_blocks     = ["10.1.0.0/16"]  # Only from private subnets
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-backend-sg"
  }
}

# Database Security Group (only from backend SG)
resource "aws_security_group" "db" {
  name        = "pasalapeli-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id
  
  # Allow traffic only from backend SG on MySQL port
  ingress {
    from_port       = 3306
    to_port       = 3306
    protocol    = "tcp"
    security_groups = [aws_security_group.backend.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-db-sg"
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public.*.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private.*.id
}
