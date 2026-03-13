#!/bin/bash
# backup.sh - Automated backup script

set -e

# Configuration
BACKUP_DIR="/backups/moxe"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Starting backup at $TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR/{database,uploads,config}

# Database backup
echo "💾 Backing up database..."
docker exec moxe_postgres pg_dump -U moxe_user moxe > "$BACKUP_DIR/database/moxe_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/database/moxe_$TIMESTAMP.sql"

# Uploads backup
echo "📁 Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads/uploads_$TIMESTAMP.tar.gz" -C /var/lib/docker/volumes/moxe_backend_uploads/_data .

# Configuration backup
echo "⚙️ Backing up configuration..."
cp /opt/moxe/.env* "$BACKUP_DIR/config/"
cp /opt/moxe/docker-compose*.yml "$BACKUP_DIR/config/"

# Clean old backups
echo "🧹 Cleaning backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR/database -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/uploads -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo "✅ Backup completed. Total size: $BACKUP_SIZE"

# Upload to S3 (if configured)
if [ -n "$AWS_BACKUP_BUCKET" ]; then
    echo "☁️ Uploading to S3..."
    aws s3 sync $BACKUP_DIR s3://$AWS_BACKUP_BUCKET/$TIMESTAMP/
fi

# Log backup
echo "$TIMESTAMP - Backup completed - Size: $BACKUP_SIZE" >> $BACKUP_DIR/backup.log