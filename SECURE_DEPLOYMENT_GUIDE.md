# 🔒 SECURE DEPLOYMENT GUIDE
## Angkor Compliance - Production Deployment

**⚠️ IMPORTANT**: Never commit API keys or secrets to version control!

---

## 🚀 **DEPLOYMENT STEPS**

### **1. Environment Setup**

**Required Environment Variables** (set in deployment platform):
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Security
JWT_SECRET=your-256-bit-jwt-secret
SESSION_SECRET=your-session-secret

# Application
NODE_ENV=production
PORT=3000
```

### **2. Netlify Deployment**

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Set Environment Variables**: Add all required environment variables
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy**: Trigger deployment

### **3. Vercel Deployment**

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `vercel --prod`
3. **Set Environment Variables**: Via Vercel dashboard

---

## 🔐 **SECURITY CHECKLIST**

- [ ] **No secrets in code**: All secrets in environment variables
- [ ] **HTTPS enabled**: SSL certificate configured
- [ ] **Security headers**: HSTS, CSP, XSS protection
- [ ] **Rate limiting**: API rate limiting implemented
- [ ] **Input validation**: All inputs validated and sanitized
- [ ] **Authentication**: Secure token storage (httpOnly cookies)
- [ ] **Database security**: RLS policies enabled

---

## 📋 **POST-DEPLOYMENT VERIFICATION**

1. **Health Check**: `https://your-domain.com/api/health`
2. **Authentication**: Test login/register flow
3. **Security Scan**: Run security vulnerability scan
4. **Performance Test**: Verify response times
5. **Backup Verification**: Confirm backup systems working

---

## 🆘 **EMERGENCY CONTACTS**

- **Security Issues**: [Security Team Contact]
- **Deployment Issues**: [DevOps Team Contact]
- **Supabase Support**: https://supabase.com/support

---

**Remember**: Security first! Never expose secrets in public repositories.