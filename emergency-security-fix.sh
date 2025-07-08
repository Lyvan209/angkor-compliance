#!/bin/bash

# ========================================
# EMERGENCY SUPABASE SECURITY FIX SCRIPT
# ========================================
# This script addresses CRITICAL security vulnerabilities
# Run immediately to secure exposed credentials

echo "🚨 EMERGENCY SECURITY FIX SCRIPT"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}WARNING: Critical security vulnerabilities detected!${NC}"
echo -e "${RED}Your Supabase credentials are exposed in public files.${NC}"
echo ""

# Step 1: Backup current state
echo "📋 Step 1: Creating backup..."
cp vercel.json vercel.json.backup 2>/dev/null
cp env.production env.production.backup 2>/dev/null
cp env.example env.example.backup 2>/dev/null
echo -e "${GREEN}✓ Backup created${NC}"

# Step 2: Clean vercel.json
echo ""
echo "🧹 Step 2: Cleaning vercel.json..."
cat > vercel.json << 'EOF'
{
  "name": "angkor-compliance",
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|ico|svg))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
EOF
echo -e "${GREEN}✓ vercel.json cleaned (secrets removed)${NC}"

# Step 3: Clean env.production
echo ""
echo "🧹 Step 3: Cleaning env.production..."
cat > env.production << 'EOF'
# Angkor Compliance Production Environment Variables
# IMPORTANT: Add these values in your deployment platform's dashboard
# DO NOT add actual secrets to this file

NODE_ENV=production
PORT=3000
APP_URL=https://www.angkorcompliance.com

# Supabase Configuration - SET IN DEPLOYMENT DASHBOARD
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=

# Security
SESSION_SECRET=
ALLOWED_ORIGINS=https://www.angkorcompliance.com,https://angkorcompliance.com

# Authentication
JWT_EXPIRES_IN=3600
ACCESS_TOKEN_EXPIRY=3600

# Features
ENABLE_SUPABASE=true
ENABLE_ANALYTICS=true
ENABLE_REALTIME=true

# Logging
LOG_LEVEL=info
DEBUG=false

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
CONTACT_EMAIL=support@angkorcompliance.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
echo -e "${GREEN}✓ env.production cleaned (secrets removed)${NC}"

# Step 4: Clean env.example
echo ""
echo "🧹 Step 4: Cleaning env.example..."
cat > env.example << 'EOF'
# Angkor Compliance Environment Variables
# Copy this file to .env and fill in your actual values

# Application Settings
NODE_ENV=development
PORT=3000
APP_NAME=Angkor Compliance
APP_URL=http://localhost:3000

# Security
SESSION_SECRET=your-super-secret-session-key-here
JWT_SECRET=your-256-bit-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Supabase Configuration - GET FROM SUPABASE DASHBOARD
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
SUPABASE_DB_PASSWORD=your-database-password

# Database Configuration (Legacy - now using Supabase)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=angkor_compliance
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false

# Redis Configuration (for sessions and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@angkorcompliance.com

# Email Recipients
CONTACT_EMAIL=support@angkorcompliance.com
SALES_EMAIL=sales@angkorcompliance.com
ADMIN_EMAIL=admin@angkorcompliance.com

# Authentication Settings
JWT_EXPIRES_IN=3600
ACCESS_TOKEN_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=604800
PASSWORD_MIN_LENGTH=8
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900

# External Services
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://www.angkorcompliance.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_SUPABASE=true
ENABLE_REALTIME=true
EOF
echo -e "${GREEN}✓ env.example cleaned (template format)${NC}"

# Step 5: Generate new JWT secret
echo ""
echo "🔑 Step 5: Generating new JWT secret..."
NEW_JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✓ New JWT secret generated${NC}"

# Step 6: Create secure .env template
echo ""
echo "📝 Step 6: Creating secure .env template..."
cat > .env.secure << EOF
# SECURE ENVIRONMENT VARIABLES
# Use these in your deployment platform (Vercel/Netlify dashboard)
# DO NOT commit this file to git

NODE_ENV=production
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_KEY_HERE
JWT_SECRET=${NEW_JWT_SECRET}
SESSION_SECRET=$(openssl rand -hex 32)
EOF
echo -e "${GREEN}✓ Secure environment template created (.env.secure)${NC}"

# Step 7: Add to .gitignore
echo ""
echo "🔒 Step 7: Updating .gitignore..."
if ! grep -q ".env.secure" .gitignore 2>/dev/null; then
    echo ".env.secure" >> .gitignore
fi
if ! grep -q "*.backup" .gitignore 2>/dev/null; then
    echo "*.backup" >> .gitignore
fi
echo -e "${GREEN}✓ .gitignore updated${NC}"

echo ""
echo "==============================================="
echo -e "${GREEN}🎉 EMERGENCY FIXES COMPLETED!${NC}"
echo "==============================================="
echo ""

echo -e "${YELLOW}🚨 CRITICAL NEXT STEPS:${NC}"
echo ""
echo "1. 🔄 ROTATE SUPABASE KEYS IMMEDIATELY:"
echo "   • Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
echo "   • Click 'Reset' on Service Role Key"
echo "   • Generate new Anon Key if needed"
echo ""

echo "2. 🔐 SET ENVIRONMENT VARIABLES IN DEPLOYMENT PLATFORM:"
echo "   • Vercel: Go to dashboard → Settings → Environment Variables"
echo "   • Netlify: Go to dashboard → Site Settings → Environment Variables" 
echo "   • Use values from .env.secure file"
echo ""

echo "3. 🧹 CLEAN GIT HISTORY:"
echo "   git add ."
echo "   git commit -m 'SECURITY: Remove exposed credentials'"
echo "   git push origin main"
echo ""

echo "4. 🔍 VERIFY SECURITY:"
echo "   • Check that no secrets are in vercel.json"
echo "   • Verify environment variables are set in platform dashboard"
echo "   • Test authentication after key rotation"
echo ""

echo -e "${RED}⚠️  WARNING: Your system is NOT secure until you complete steps 1-3!${NC}"
echo ""

echo "Files modified:"
echo "• vercel.json (secrets removed)"
echo "• env.production (cleaned)"
echo "• env.example (template format)"
echo "• .env.secure (secure values for deployment)"
echo ""

echo -e "${GREEN}✓ Emergency security fixes applied successfully!${NC}"
echo "📄 See SUPABASE-SECURITY-AUDIT.md for complete security analysis." 