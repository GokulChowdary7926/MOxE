#!/bin/bash
# deploy.sh - Complete deployment script for MOxE platform

set -e

# Configuration
PROJECT_NAME="moxe"
DEPLOY_ENV=${1:-production}
BACKUP_DIR="/backups/$PROJECT_NAME"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Deploying MOxE platform to $DEPLOY_ENV environment"

# Load environment variables
if [ -f ".env.$DEPLOY_ENV" ]; then
    source ".env.$DEPLOY_ENV"
else
    echo "❌ Environment file .env.$DEPLOY_ENV not found"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local retries=30
    local wait=5
    
    echo "⏳ Waiting for $service to be healthy..."
    
    for i in $(seq 1 $retries); do
        if curl -s -f -o /dev/null "$url"; then
            echo "✅ $service is healthy"
            return 0
        fi
        echo "   Attempt $i/$retries - waiting ${wait}s..."
        sleep $wait
    done
    
    echo "❌ $service failed health check"
    return 1
}

# Database backup
echo "📦 Creating database backup..."
docker exec moxe_postgres pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "✅ Database backup created: backup_$TIMESTAMP.sql.gz"

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml pull

# Deploy new version
echo "🚀 Deploying new version..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d --remove-orphans

# Check health of each service
check_health "backend" "http://localhost:5000/health"
check_health "frontend" "http://localhost:3000"
check_health "api" "https://api.$DOMAIN/health"

# Run database migrations
echo "🔄 Running database migrations..."
docker exec moxe_backend npm run prisma:migrate

# Clear cache
echo "🗑️ Clearing cache..."
docker exec moxe_redis redis-cli FLUSHALL
docker exec moxe_backend npm run cache:clear

# Update search index
echo "🔍 Updating search index..."
docker exec moxe_backend npm run search:reindex

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

# Check disk usage
echo "💾 Checking disk usage..."
df -h

# Send deployment notification
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ MOxE platform deployed successfully to $DEPLOY_ENV at $TIMESTAMP\"}" \
        $SLACK_WEBHOOK
fi

echo "✅ Deployment completed successfully!"
echo "📝 Deployment time: $TIMESTAMP"
echo "🌎 Application URL: https://$DOMAIN"