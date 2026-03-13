# backend/.env

# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://moxe_user:moxe_password@localhost:5432/moxe"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRY="7d"

# AWS S3 (for media storage)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="us-east-1"
AWS_BUCKET="moxe-media"

# Twilio (for SMS)
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_PHONE_NUMBER="+1234567890"

# SendGrid (for email)
SENDGRID_API_KEY="your_sendgrid_key"
SENDGRID_FROM_EMAIL="noreply@moxe.com"

# Stripe (for payments)
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Client URL
CLIENT_URL="http://localhost:3000"