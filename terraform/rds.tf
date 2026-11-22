# RDS MySQL Database
resource "aws_db_instance" "mysql" {
  identifier              = "pasalapeli-db"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  username                = "admin"
  parameter_group_name    = "mysql8.0"
  skip_final_snapshot     = true
  publicly_accessible     = false
  storage_type            = "gp2"
  allocated_storage       = 20
  backup_retention_period = 7

  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-db"
  }
}