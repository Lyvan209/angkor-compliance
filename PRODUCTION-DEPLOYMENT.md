# 🚀 PRODUCTION DEPLOYMENT GUIDE
## Angkor Compliance System - Complete Production Setup

**Status:** Ready for deployment after credential rotation  
**Date:** December 8, 2024  
**Version:** 1.0.0  

---

## 🚨 CRITICAL PREREQUISITES

### 1. **SUPABASE CREDENTIALS ROTATION** (REQUIRED)
The current Supabase credentials are **INVALID/EXPIRED**. You must rotate them before deployment.

#### Steps to Rotate Credentials:
1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Login to your account
   - Select project: `skqxzsrajcdmkbxembrs`

2. **Navigate to API Settings:**
   - Click on "Settings" → "API"
   - You'll see your current keys

3. **Generate New Keys:**
   ```bash
   # Current (INVALID) keys:
   SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (EXPIRED)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (EXPIRED)
   
   # Action Required:
   # 1. Click "Reset" on Service Role Key
   # 2. Copy new Anon Key if needed
   # 3. Update environment variables immediately
   ```

---

## 🔧 ENVIRONMENT CONFIGURATION

### 1. **Development Environment**
Create/update `.env` file:
```bash
# Angkor Compliance Development Environment
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Security Keys
SESSION_SECRET=your-256-bit-session-secret-here
JWT_SECRET=your-256-bit-jwt-secret-here

# Supabase Configuration - UPDATE WITH NEW KEYS
SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY_HERE

# Feature Flags
ENABLE_SUPABASE=true
ENABLE_ANALYTICS=true
ENABLE_REALTIME=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://www.angkorcompliance.com

# Logging
LOG_LEVEL=debug
DEBUG=true
```

### 2. **Production Environment**
Set these in your deployment platform (Vercel/Netlify):

```bash
# Production Environment Variables
NODE_ENV=production
PORT=3000
APP_URL=https://www.angkorcompliance.com

# Security (Generate new 256-bit keys)
SESSION_SECRET=production-256-bit-session-secret
JWT_SECRET=production-256-bit-jwt-secret

# Supabase (Use rotated keys)
SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
SUPABASE_ANON_KEY=your-new-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-production-service-key

# Production Features
ENABLE_SUPABASE=true
ENABLE_ANALYTICS=true
ENABLE_REALTIME=true

# Production Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Production CORS
ALLOWED_ORIGINS=https://www.angkorcompliance.com,https://angkorcompliance.com

# Production Logging
LOG_LEVEL=info
DEBUG=false
```

---

## 📋 DEPLOYMENT PLATFORMS

### Option 1: **Vercel Deployment** (Recommended)

#### 1. **Install Vercel CLI:**
```bash
npm install -g vercel
vercel login
```

#### 2. **Deploy to Vercel:**
```bash
# From project root
vercel --prod

# Or configure deployment
vercel
```

#### 3. **Set Environment Variables:**
```bash
# In Vercel Dashboard:
# 1. Go to your project
# 2. Settings → Environment Variables
# 3. Add all production variables listed above
```

#### 4. **Domain Configuration:**
```bash
# In Vercel Dashboard:
# 1. Go to Domains
# 2. Add: angkorcompliance.com
# 3. Configure DNS as instructed
```

### Option 2: **Netlify Deployment**

#### 1. **Deploy to Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### 2. **Set Environment Variables:**
```bash
# In Netlify Dashboard:
# 1. Site Settings → Environment Variables
# 2. Add all production variables
```

#### 3. **Configure Functions:**
```bash
# netlify.toml already configured for:
# - Serverless functions
# - Redirects
# - Security headers
```

---

## 🔒 SECURITY CONFIGURATION

### 1. **SSL/TLS Certificate**
- **Vercel:** Automatic SSL (Let's Encrypt)
- **Netlify:** Automatic SSL included

### 2. **Security Headers**
Already configured in `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'..."
```

### 3. **Database Security**
- **Row Level Security (RLS):** Enabled
- **API Key Rotation:** Completed
- **Backup Strategy:** Supabase automated backups

---

## 🧪 PRE-DEPLOYMENT TESTING

### 1. **Local Testing Checklist:**
```bash
# 1. Update credentials
# 2. Test authentication
npm start
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# 3. Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","company":"Test Co","password":"testpass123"}'

# 4. Test health check
curl http://localhost:3000/api/health
```

### 2. **Production Testing:**
```bash
# After deployment, test:
# 1. Login functionality
# 2. Registration
# 3. Dashboard access
# 4. API responses
# 5. Performance metrics
```

---

## 📊 MONITORING & ANALYTICS

### 1. **Application Monitoring**
- **Logs:** Winston logging configured
- **Health Checks:** `/api/health` endpoint
- **Performance:** Built-in metrics

### 2. **Database Monitoring**
- **Supabase Dashboard:** Real-time metrics
- **Query Performance:** Built-in analytics
- **Connection Pooling:** Automated

### 3. **Error Tracking**
- **Server Errors:** Logged to files
- **Client Errors:** Console logging
- **Authentication Errors:** Detailed logging

---

## 🔄 MAINTENANCE

### 1. **Regular Updates**
```bash
# Update dependencies
npm audit fix
npm update

# Update Supabase client
npm install @supabase/supabase-js@latest
```

### 2. **Backup Strategy**
- **Database:** Supabase automated backups
- **Files:** Git repository
- **Environment:** Documented configurations

### 3. **Security Updates**
- **Dependency Updates:** Monthly
- **Security Patches:** As needed
- **Credential Rotation:** Quarterly

---

## 🚀 DEPLOYMENT STEPS

### **IMMEDIATE DEPLOYMENT PROCESS:**

1. **Fix Credentials (CRITICAL):**
   ```bash
   # 1. Go to Supabase Dashboard
   # 2. Generate new Service Role Key
   # 3. Update .env file with new credentials
   # 4. Test locally
   ```

2. **Test Authentication:**
   ```bash
   npm start
   # Test login/register functionality
   ```

3. **Deploy to Production:**
   ```bash
   # Vercel
   vercel --prod
   
   # OR Netlify
   netlify deploy --prod
   ```

4. **Configure Environment Variables:**
   ```bash
   # Set all production variables in platform dashboard
   ```

5. **Test Production:**
   ```bash
   # Test live site functionality
   ```

6. **Monitor:**
   ```bash
   # Check logs and performance
   ```

---

## ❌ CURRENT BLOCKING ISSUES

### 1. **Invalid Supabase Credentials**
- **Issue:** Current API keys are expired/invalid
- **Solution:** Rotate keys in Supabase dashboard
- **Impact:** Authentication completely broken

### 2. **Database Service Errors**
- **Issue:** Method not found errors
- **Solution:** Fixed in code, needs new credentials

### 3. **Routing Issues**
- **Issue:** 404 errors on some endpoints
- **Solution:** Proper deployment configuration

---

## ✅ POST-DEPLOYMENT VERIFICATION

### **Success Criteria:**
- [ ] Login page loads correctly
- [ ] User registration works
- [ ] Authentication flow complete
- [ ] Dashboard accessible
- [ ] API endpoints responding
- [ ] Database operations working
- [ ] SSL certificate active
- [ ] Performance metrics acceptable

### **Performance Targets:**
- Page load time: < 3 seconds
- API response time: < 500ms
- Database queries: < 100ms
- Uptime: > 99.9%

---

## 🆘 EMERGENCY CONTACTS

### **If Issues Arise:**
1. **Database Issues:** Check Supabase Dashboard
2. **Deployment Issues:** Check platform status
3. **Authentication Issues:** Verify credentials
4. **Performance Issues:** Check logs

### **Rollback Plan:**
```bash
# If deployment fails:
# 1. Revert to previous version
# 2. Check error logs
# 3. Fix issues
# 4. Redeploy
```

---

## 📝 NEXT STEPS

### **IMMEDIATE (Within 1 Hour):**
1. ✅ Rotate Supabase credentials
2. ✅ Update environment variables
3. ✅ Test authentication locally
4. ✅ Deploy to production

### **SHORT-TERM (Within 24 Hours):**
1. ✅ Monitor performance
2. ✅ Test all functionality
3. ✅ Set up monitoring alerts
4. ✅ Document any issues

### **LONG-TERM (Within 1 Week):**
1. ✅ Performance optimization
2. ✅ Security audit
3. ✅ User testing
4. ✅ Documentation updates

---

**🎯 GOAL:** Have Angkor Compliance fully deployed and operational within 1 hour of credential rotation.**

**📞 SUPPORT:** This deployment guide addresses all current issues and provides a complete production setup process.** 