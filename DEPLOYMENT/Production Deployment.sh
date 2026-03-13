# Build for production
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# Configure nginx for production
# (see docker/nginx.prod.conf)