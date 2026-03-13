# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate

# Seed database (optional)
npm run seed