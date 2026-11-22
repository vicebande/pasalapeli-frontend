# SNS Topic for events
resource "aws_sns_topic" "events" {
  name = "pasalapeli-events"

  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-events"
  }
}

# SQS Queue for events
resource "aws_sqs_queue" "events" {
  name = "pasalapeli-events-queue"

  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-events-queue"
  }
}

# Kinesis Stream for metrics
resource "aws_kinesis_stream" "metrics" {
  name               = "pasalapeli-metrics-stream"
  shard_count        = 1
  retention_period   = 24

  tags = {
    Environment = var.environment_name
    Name        = "pasalapeli-metrics-stream"
  }
}