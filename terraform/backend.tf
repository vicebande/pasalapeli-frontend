terraform {
  backend "s3" {
    bucket         = "pasalapeli-terraform-state"
    key            = "frontend/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    # Credenciales AWS se proporcionan via variables de entorno
  }
}
