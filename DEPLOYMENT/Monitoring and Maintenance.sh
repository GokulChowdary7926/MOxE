# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database backup
docker exec moxe_postgres pg_dump -U moxe_user moxe > backup.sql

# Restore database
cat backup.sql | docker exec -i moxe_postgres psql -U moxe_user moxe

# Update application
git pull
docker-compose build
docker-compose up -d