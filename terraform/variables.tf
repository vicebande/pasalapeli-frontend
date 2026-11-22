variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive     = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive     = true
}

variable "aws_session_token" {
  description = "AWS Session Token"
  type        = string
  sensitive     = true
}

variable "environment_name" {
  description = "Nombre del entorno (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Dominio de la aplicación"
  type        = string
  default     = "pasalapeli-frontend"
}
