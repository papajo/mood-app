# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Server hosting (Heroku, Railway, AWS, etc.)
- Domain name (optional but recommended)

### Step 1: Build the Application

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# The dist/ folder contains the production build
```

### Step 2: Deploy Backend

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd server
pm2 start index.js --name moodmingle-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option B: Using Docker

```bash
# Build Docker image
docker build -t moodmingle-server -f server/Dockerfile server/

# Run container
docker run -d \
  -p 3002:3002 \
  -v $(pwd)/server/moodmingle.db:/app/moodmingle.db \
  -e PORT=3002 \
  -e FRONTEND_URL=https://yourdomain.com \
  moodmingle-server
```

#### Option C: Using docker-compose

```bash
docker-compose up -d
```

### Step 3: Deploy Frontend

#### Option A: Static Hosting (Vercel, Netlify, etc.)

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-api-url.com`

#### Option B: Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/moodmingle/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 4: Environment Variables

#### Backend (.env)
```env
PORT=3002
FRONTEND_URL=https://yourdomain.com
DB_PATH=./moodmingle.db
NODE_ENV=production
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

### Step 5: Database Backup

```bash
# Backup SQLite database
cp server/moodmingle.db server/moodmingle.db.backup

# Or use automated backups
# Add to crontab: 0 2 * * * cp /path/to/moodmingle.db /backups/moodmingle-$(date +\%Y\%m\%d).db
```

### Step 6: SSL/HTTPS

Required for PWA and secure WebSocket connections:

```bash
# Using Let's Encrypt (Certbot)
sudo certbot --nginx -d yourdomain.com
```

### Step 7: Monitoring

#### Health Check Endpoint

Add to server:
```javascript
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

#### Logging

```bash
# PM2 logs
pm2 logs moodmingle-api

# Docker logs
docker logs moodmingle-server
```

## 📱 Mobile App Deployment

### iOS (App Store)

1. **Build iOS App**
```bash
npm run build
npx cap sync ios
npx cap open ios
```

2. **In Xcode**
   - Select development team
   - Update version and build number
   - Archive (Product > Archive)
   - Upload to App Store Connect

3. **App Store Connect**
   - Complete app information
   - Upload screenshots
   - Submit for review

### Android (Play Store)

1. **Build Android App**
```bash
npm run build
npx cap sync android
npx cap open android
```

2. **In Android Studio**
   - Build > Generate Signed Bundle / APK
   - Create release keystore (first time)
   - Build release AAB

3. **Play Console**
   - Create app listing
   - Upload AAB
   - Complete store listing
   - Submit for review

## 🔧 Post-Deployment

### Verify Deployment

1. Test all features:
   - User creation
   - Mood selection
   - Matching
   - Chat rooms
   - Journal entries

2. Check performance:
   - Page load times
   - API response times
   - WebSocket connections

3. Monitor errors:
   - Check server logs
   - Monitor client errors
   - Set up error tracking (Sentry, etc.)

### Maintenance

- Regular database backups
- Monitor server resources
- Update dependencies regularly
- Review and rotate API keys
- Monitor user feedback

## 🆘 Troubleshooting

### Common Issues

**CORS Errors**
- Check FRONTEND_URL in backend .env
- Verify CORS settings in server/index.js

**Socket.io Connection Issues**
- Ensure WebSocket support on server
- Check firewall settings
- Verify SSL certificates

**Database Locked**
- Check for multiple server instances
- Ensure proper database file permissions

**Build Failures**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Review build logs for specific errors
