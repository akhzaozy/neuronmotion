#!/bin/bash
set -e

DEST="/www/wwwroot/hosting/neuronmotion"

echo "Setting up repository..."
mkdir -p "$DEST"
if [ ! -d "$DEST/.git" ]; then
    # If the directory doesn't exist or is not a git repo, remove and clone
    rm -rf "$DEST"
    git clone https://github.com/akhzaozy/neuronmotion "$DEST"
else
    # Pull latest changes
    cd "$DEST"
    git pull origin main
fi

cd "$DEST"

# Make sure .env is copied from the uploaded location if it exists
if [ -f /tmp/neuronmotion_env ]; then
    cp /tmp/neuronmotion_env .env
fi

echo "Installing PM2 if missing..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "Installing backend dependencies..."
npm install
npx prisma generate

echo "Installing frontend dependencies and building..."
cd webapp
echo "NEXT_PUBLIC_API_URL=/api" > .env
npm install
npm run build
cd ..

echo "Starting applications with PM2..."
pm2 delete neuronmotion-api 2>/dev/null || true
pm2 delete neuronmotion-web 2>/dev/null || true

pm2 start server/index.js --name "neuronmotion-api"
pm2 start npm --name "neuronmotion-web" -- run start --prefix webapp -- -p 38473

pm2 save

echo "Configuring Nginx..."
cat << 'NGINX' > /etc/nginx/sites-available/neuromotion
server {
    listen 80;
    server_name neuromotion.akhzafachrozy.my.id;

    location / {
        proxy_pass http://localhost:38473;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:38472;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/neuromotion /etc/nginx/sites-enabled/
systemctl restart nginx || echo "Warning: Nginx failed to restart"

echo "Configuring asdos-tunnel..."
if command -v asdos-tunnel &> /dev/null; then
    asdos-tunnel create neuromotion.akhzafachrozy.my.id || echo "asdos-tunnel creation failed"
else
    echo "Warning: asdos-tunnel command not found. Please set up the domain manually."
fi

echo "Deployment finished successfully!"
