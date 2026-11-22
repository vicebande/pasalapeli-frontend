# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster" {
  name = "pasalapeli-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "eks.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ECR Repository for frontend
resource "aws_ecr_repository" "frontend" {
  name = "pasalapeli-frontend"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# EKS Cluster
resource "aws_eks_cluster" "primary" {
  name = "pasalapeli-cluster"

  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids = data.aws_subnet_ids.private.ids
    security_groups = [aws_security_group.frontend.id]
  }

  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-cluster"
  }
}