# 🚨 EMERGENCY DEPLOYMENT FIX GUIDE

## Current Issue: 404 API Errors on Login

### Root Cause Analysis ✅
- **Issue**: API endpoints returning 404 (specifically seeing `api/auth/login1` with extra "1")
- **Platform**: Netlify deployment at angkorcompliance.com
- **Problem**: Netlify Functions not properly configured or environment variables missing

---

## 🔧 IMMEDIATE FIXES

### 1. Environment Variables (CRITICAL)
Add these to your Netlify site settings:

```bash
# Go to: Site Settings > Environment Variables
NODE_ENV=production
SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXh6c3JhamNkbWtieGVtYnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDMzODAsImV4cCI6MjA2NzIxOTM4MH0.Jdbgnse0y4c1KzRhf4ehtNYZq4tSLqD-nw_D7CmTfq8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXh6c3JhamNkbWtieGVtYnJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0MzM4MCwiZXhwIjoyMDY3MjE5MzgwfQ.eiGMoTJqpHTgp9W6gy06kNyGU0uNKePxJiepXEIzTF8
JWT_SECRET=UXXZIp4AZ/oP08ms2DWlv8/nQ9FtqrJBhOyzMtL7BHEZkSMlm6gv/J+e4G/OXmhUcX4MhWU9fYG1OE6XjPrP1A==
```

### 2. Redeploy Site
After adding environment variables:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

### 3. Test Endpoints
After redeployment, test these URLs:

- **Debug endpoint**: `https://angkorcompliance.com/.netlify/functions/debug`
- **Health check**: `https://angkorcompliance.com/api/auth/health`
- **Login endpoint**: `https://angkorcompliance.com/api/auth/login` (POST)

---

## 🔍 DEBUGGING STEPS

### Step 1: Check Function Deployment
```bash
# Visit this URL to see if functions are deployed:
https://angkorcompliance.com/.netlify/functions/debug
```

Expected response:
```json
{
  "timestamp": "2024-01-XX...",
  "environment": {
    "SUPABASE_URL": "configured",
    "SUPABASE_ANON_KEY": "configured",
    "JWT_SECRET": "configured"
  }
}
```

### Step 2: Check Netlify Build Log
1. Go to **Deploys** in Netlify dashboard
2. Click on latest deploy
3. Check build logs for errors
4. Look for "Functions bundled" confirmation

### Step 3: Test Authentication
```bash
# Test login endpoint:
curl -X POST https://angkorcompliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
```

---

## 🚀 ALTERNATIVE DEPLOYMENT OPTIONS

If Netlify continues to have issues:

### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables via Vercel dashboard
```

### Option B: Traditional Server
```bash
# Use PM2 on VPS/Cloud server
npm install -g pm2
pm2 start server.js --name angkor-compliance
```

### Option C: Static Deployment (Fallback)
```bash
# Deploy as static site temporarily
# Remove all server-side functionality
# Use Supabase directly from frontend
```

---

## 📋 CHECKLIST FOR RESOLUTION

### ✅ Immediate Actions (5 minutes)
- [ ] Add environment variables to Netlify
- [ ] Trigger new deployment
- [ ] Test debug endpoint
- [ ] Test login form

### ✅ If Still Not Working (15 minutes)
- [ ] Check Netlify function logs
- [ ] Verify netlify.toml syntax
- [ ] Test individual function endpoints
- [ ] Check for build errors

### ✅ Escalation Options (30 minutes)
- [ ] Deploy to Vercel as backup
- [ ] Create minimal static version
- [ ] Contact Netlify support
- [ ] Switch to traditional hosting

---

## 🆘 EMERGENCY CONTACTS

If you need immediate assistance:
- **Netlify Support**: https://www.netlify.com/support/
- **Supabase Support**: https://supabase.com/support
- **Debug URL**: https://angkorcompliance.com/.netlify/functions/debug

---

## 📞 VERIFICATION COMMANDS

After fixes are applied:

```bash
# 1. Test health endpoint
curl https://angkorcompliance.com/api/auth/health

# 2. Test login (will fail with invalid credentials, but should not 404)
curl -X POST https://angkorcompliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test", "password": "test"}'

# 3. Check debug info
curl https://angkorcompliance.com/.netlify/functions/debug
```

Expected results:
- Health: 200 status with JSON response
- Login: 400/401 status (not 404)
- Debug: 200 status with environment info

---

## 🎯 SUCCESS CRITERIA

✅ **Issue Resolved When:**
- Login form no longer shows 404 errors
- Users can successfully authenticate
- Dashboard access works properly
- No console errors on login page

Deploy these fixes immediately and test the endpoints! 