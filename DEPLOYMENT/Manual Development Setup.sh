# Terminal 1: Start database services
docker-compose up postgres redis elasticsearch

# Terminal 2: Start backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Terminal 3: Start frontend
cd frontend
npm install
npm start