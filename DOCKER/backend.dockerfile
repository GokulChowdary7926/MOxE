# docker/Dockerfile.backend

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY backend/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["node", "dist/server.js"]