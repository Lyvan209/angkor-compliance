# Angkor Compliance Landing Page - Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the Angkor Compliance landing page to production environments. The landing page is designed to be deployed on various platforms including cloud services, VPS, and static hosting.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Git
- Domain name configured (www.angkorcompliance.com)
- SSL certificate for HTTPS

### Basic Setup
```bash
# Clone the repository
git clone https://github.com/angkorcompliance/landing-page.git
cd landing-page

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Configure environment variables
nano .env

# Start the application
npm start
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://www.angkorcompliance.com

# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret-key

# Email (for contact forms)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=support@angkorcompliance.com

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### Optional Environment Variables
```bash
# Database (if using backend features)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=angkor_compliance

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=angkor-compliance-assets
```

## 🌐 Deployment Methods

### Method 1: Static Hosting (Recommended for Landing Page)

#### Using Vercel
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Domain**
   - Add your domain in Vercel dashboard
   - Update DNS records to point to Vercel

#### Using Netlify
1. **Build the static files**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

3. **Configure redirects** (create `_redirects` file)
   ```
   /*    /index.html   200
   ```

### Method 2: VPS/Cloud Server Deployment

#### Using PM2 (Process Manager)
1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file** (`ecosystem.config.js`)
   ```javascript
   module.exports = {
     apps: [{
       name: 'angkor-compliance',
       script: './server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

3. **Deploy with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Using Docker
1. **Create Dockerfile**
   ```dockerfile
   FROM node:16-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   RUN npm run build
   
   EXPOSE 3000
   
   USER node
   
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t angkor-compliance .
   docker run -p 3000:3000 --env-file .env angkor-compliance
   ```

### Method 3: AWS Deployment

#### Using AWS S3 + CloudFront (Static)
1. **Build static files**
   ```bash
   npm run build
   ```

2. **Deploy to S3**
   ```bash
   aws s3 sync dist/ s3://angkor-compliance-web --delete
   ```

3. **Configure CloudFront**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure SSL certificate

#### Using AWS Elastic Beanstalk
1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize and deploy**
   ```bash
   eb init
   eb create production
   eb deploy
   ```

## 🔒 Security Configuration

### SSL/TLS Certificate
- **Let's Encrypt (Free)**
  ```bash
  # Using Certbot
  certbot --nginx -d www.angkorcompliance.com
  ```

- **CloudFlare (Free)**
  - Sign up for CloudFlare
  - Add your domain
  - Enable SSL/TLS encryption

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name www.angkorcompliance.com angkorcompliance.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.angkorcompliance.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Performance Optimization

### Build Optimization
```bash
# Minify CSS and JS
npm run build

# Compress assets
npm run compress

# Generate service worker
npm run build:sw
```

### Caching Strategy
- **Static assets**: 1 year cache
- **HTML files**: No cache
- **API responses**: 5 minutes cache
- **Images**: 30 days cache

### CDN Configuration
```javascript
// Configure CDN URLs
const CDN_URL = process.env.CDN_URL || '';
const ASSET_URL = CDN_URL ? `${CDN_URL}/assets` : '/assets';
```

## 🔍 Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install --save newrelic @sentry/node
```

### Log Management
```javascript
// Winston logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Checks
```bash
# Check application health
curl https://www.angkorcompliance.com/api/health
```

## 🚨 Backup and Recovery

### Database Backup
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DB_NAME > backups/db_backup_$DATE.sql
```

### File Backup
```bash
# Sync to S3
aws s3 sync uploads/ s3://angkor-compliance-backups/uploads/
```

## 📱 Mobile Optimization

### PWA Configuration
```javascript
// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Responsive Images
```html
<!-- Responsive image configuration -->
<picture>
  <source media="(max-width: 768px)" srcset="/images/mobile/hero.jpg">
  <source media="(max-width: 1200px)" srcset="/images/tablet/hero.jpg">
  <img src="/images/desktop/hero.jpg" alt="Angkor Compliance">
</picture>
```

## 🌍 Internationalization

### Language Detection
```javascript
// Auto-detect user language
const userLanguage = navigator.language || navigator.userLanguage;
if (userLanguage.includes('km') || userLanguage.includes('kh')) {
  setLanguage('kh');
}
```

### Font Loading
```css
/* Khmer font loading */
@font-face {
  font-family: 'Noto Sans Khmer';
  src: url('/fonts/NotoSansKhmer-Regular.woff2') format('woff2');
  font-display: swap;
}
```

## 🔄 Continuous Deployment

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📋 Pre-Launch Checklist

### Technical Checks
- [ ] SSL certificate installed and working
- [ ] All environment variables configured
- [ ] Database connections working
- [ ] Email service configured
- [ ] Analytics tracking installed
- [ ] Error monitoring setup
- [ ] Backup system configured
- [ ] CDN configured and working
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility verified

### Content Checks
- [ ] All text translated to Khmer
- [ ] Contact information updated
- [ ] Social media links working
- [ ] Legal pages complete
- [ ] Images optimized and compressed
- [ ] Meta tags and SEO optimized
- [ ] Accessibility features working

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Images properly optimized
- [ ] CSS and JS minified
- [ ] Caching configured
- [ ] CDN serving static assets

## 🆘 Troubleshooting

### Common Issues

**Issue**: Application won't start
```bash
# Check logs
pm2 logs angkor-compliance

# Restart application
pm2 restart angkor-compliance
```

**Issue**: Database connection error
```bash
# Check database status
systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d angkor_compliance
```

**Issue**: Email not sending
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

### Emergency Procedures

**Rollback Deployment**
```bash
# Rollback using PM2
pm2 reload ecosystem.config.js

# Rollback using Git
git revert HEAD
npm run deploy
```

**Database Recovery**
```bash
# Restore from backup
psql -h localhost -U postgres -d angkor_compliance < backups/db_backup_latest.sql
```

## 📞 Support

For deployment support, contact:
- **Technical Support**: tech@angkorcompliance.com
- **Emergency Contact**: +855 12 345 678
- **Documentation**: https://docs.angkorcompliance.com

## 📄 License

This deployment guide is part of the Angkor Compliance project and is licensed under the MIT License.

---

**Last Updated**: January 2024
**Version**: 1.0.0 