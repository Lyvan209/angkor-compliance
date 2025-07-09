# 🚨 CRITICAL SECURITY FIXES ACTION PLAN
## Immediate Security Remediation for Production Deployment

**Priority**: CRITICAL - Must be completed before deployment  
**Estimated Time**: 4-6 hours  
**Risk Level**: HIGH - System compromise possible  

---

## 🔴 **IMMEDIATE FIXES REQUIRED**

### **1. ROTATE SUPABASE API KEYS** ⚠️ CRITICAL

#### **Current Issue:**
- Supabase credentials exposed in `vercel.json` and `env.production`
- Public repository contains sensitive API keys
- Keys visible to anyone with repository access

#### **Immediate Actions:**

**Step 1: Rotate Keys in Supabase Dashboard**
```bash
# 1. Go to Supabase Dashboard
# 2. Navigate to Settings > API
# 3. Click "Reset" on service role key
# 4. Generate new anon key
# 5. Note down new keys securely
```

**Step 2: Remove Secrets from Public Files**
```bash
# Remove secrets from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch vercel.json env.production' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from remote
git push origin --force --all
```

**Step 3: Update Environment Variables**
```bash
# In Netlify/Vercel dashboard, set these environment variables:
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

**Step 4: Clean Configuration Files**
```javascript
// vercel.json - CLEAN VERSION
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
```

### **2. IMPLEMENT SECURE TOKEN STORAGE** ⚠️ CRITICAL

#### **Current Issue:**
- JWT tokens stored in localStorage (XSS vulnerable)
- Tokens accessible via JavaScript
- No CSRF protection

#### **Immediate Actions:**

**Step 1: Update Authentication Handler**
```javascript
// server.js - SECURE TOKEN HANDLING
const express = require('express');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cookieParser());

// Secure OAuth callback
app.get('/api/auth/callback/google', async (req, res) => {
    try {
        const { code } = req.query;
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) throw error;
        
        // Generate secure session ID
        const sessionId = crypto.randomUUID();
        
        // Store session server-side (Redis recommended for production)
        await storeSession(sessionId, data.user);
        
        // Set secure httpOnly cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000, // 1 hour
            path: '/'
        });
        
        // Clean redirect without tokens
        res.redirect('/dashboard.html?auth=success');
    } catch (error) {
        console.error('OAuth error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

// Session validation middleware
const validateSession = async (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
        return res.status(401).json({ error: 'No session' });
    }
    
    try {
        const user = await getSession(sessionId);
        if (!user) {
            res.clearCookie('sessionId');
            return res.status(401).json({ error: 'Invalid session' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.clearCookie('sessionId');
        return res.status(401).json({ error: 'Session error' });
    }
};

// Secure logout
app.post('/api/auth/logout', validateSession, async (req, res) => {
    try {
        await invalidateSession(req.cookies.sessionId);
        res.clearCookie('sessionId');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});
```

**Step 2: Update Client-Side Authentication**
```javascript
// Remove localStorage usage from client-side code
// dashboard.js - SECURE CLIENT CODE

// Remove this:
// localStorage.setItem('angkor_token', data.token);

// Replace with server-side session validation
const checkAuth = async () => {
    try {
        const response = await fetch('/api/auth/validate', {
            credentials: 'include' // Include cookies
        });
        
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
};

// Use this for all authenticated requests
const authenticatedFetch = async (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include' // Always include cookies
    });
};
```

### **3. FIX OAUTH TOKEN EXPOSURE** ⚠️ HIGH

#### **Current Issue:**
- OAuth tokens exposed in URL redirects
- Tokens visible in browser history and server logs
- Referer headers may leak tokens

#### **Immediate Actions:**

**Step 1: Update OAuth Flow**
```javascript
// server.js - SECURE OAUTH IMPLEMENTATION

// OAuth initiation
app.get('/api/auth/google', (req, res) => {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.APP_URL}/api/auth/callback/google`
        }
    });
    
    if (error) {
        return res.status(500).json({ error: 'OAuth initiation failed' });
    }
    
    res.redirect(data.url);
});

// Secure callback (already implemented above)
app.get('/api/auth/callback/google', async (req, res) => {
    // Implementation from previous section
});
```

**Step 2: Add CSRF Protection**
```javascript
// server.js - CSRF PROTECTION

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to all POST/PUT/DELETE routes
app.use('/api', csrfProtection);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Client-side CSRF token usage
const getCsrfToken = async () => {
    const response = await fetch('/api/csrf-token', {
        credentials: 'include'
    });
    const { csrfToken } = await response.json();
    return csrfToken;
};

// Use in all POST requests
const postData = async (url, data) => {
    const csrfToken = await getCsrfToken();
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(data)
    });
};
```

### **4. ENHANCE INPUT VALIDATION** ⚠️ HIGH

#### **Current Issue:**
- Weak email validation
- Missing SQL injection prevention
- Insufficient input sanitization

#### **Immediate Actions:**

**Step 1: Implement Comprehensive Validation**
```javascript
// validation.js - COMPREHENSIVE INPUT VALIDATION

const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

// Email validation
const emailValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .custom(value => {
            // Prevent email with consecutive dots
            if (value.includes('..')) {
                throw new Error('Invalid email format');
            }
            // Prevent email with spaces
            if (value.includes(' ')) {
                throw new Error('Email cannot contain spaces');
            }
            return true;
        })
        .withMessage('Please provide a valid email address')
];

// Password validation
const passwordValidation = [
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

// File upload validation
const fileValidation = [
    body('file')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('File is required');
            }
            
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new Error('Invalid file type');
            }
            
            if (req.file.size > maxSize) {
                throw new Error('File too large');
            }
            
            return true;
        })
];

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = DOMPurify.sanitize(req.body[key]);
            }
        });
    }
    next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

module.exports = {
    emailValidation,
    passwordValidation,
    fileValidation,
    sanitizeInput,
    handleValidationErrors
};
```

**Step 2: Apply Validation to Routes**
```javascript
// server.js - APPLY VALIDATION

const {
    emailValidation,
    passwordValidation,
    fileValidation,
    sanitizeInput,
    handleValidationErrors
} = require('./validation');

// Registration endpoint
app.post('/api/auth/register',
    sanitizeInput,
    emailValidation,
    passwordValidation,
    handleValidationErrors,
    async (req, res) => {
        // Registration logic
    }
);

// Login endpoint
app.post('/api/auth/login',
    sanitizeInput,
    emailValidation,
    handleValidationErrors,
    async (req, res) => {
        // Login logic
    }
);
```

---

## 🛡️ **SECURITY HEADERS IMPLEMENTATION**

### **Add Security Headers**
```javascript
// server.js - SECURITY HEADERS

const helmet = require('helmet');

// Comprehensive security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", process.env.SUPABASE_URL],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    frameguard: {
        action: 'deny'
    }
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});
```

---

## 🔄 **RATE LIMITING IMPLEMENTATION**

### **Add Rate Limiting**
```javascript
// server.js - RATE LIMITING

const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);
```

---

## 📋 **VERIFICATION CHECKLIST**

### **After Implementing Fixes:**

- [ ] **API Keys Rotated**: New keys generated and old ones invalidated
- [ ] **Secrets Removed**: No secrets visible in public files
- [ ] **Token Storage**: Only httpOnly cookies used for tokens
- [ ] **OAuth Flow**: No tokens exposed in URLs
- [ ] **Input Validation**: All inputs properly validated and sanitized
- [ ] **Security Headers**: All security headers implemented
- [ ] **Rate Limiting**: Rate limiting active on all endpoints
- [ ] **CSRF Protection**: CSRF tokens implemented
- [ ] **HTTPS**: HTTPS redirects working
- [ ] **Error Handling**: Secure error messages (no sensitive data)

### **Testing Checklist:**

- [ ] **Authentication**: Login/register works with new token system
- [ ] **OAuth**: Google OAuth flow works without token exposure
- [ ] **Validation**: Invalid inputs properly rejected
- [ ] **Rate Limiting**: Rate limits enforced under load
- [ ] **Security Headers**: Headers present in response
- [ ] **CSRF**: CSRF protection working on forms
- [ ] **Logout**: Secure logout clears sessions

---

## 🚀 **DEPLOYMENT READINESS**

### **After Security Fixes:**

1. **Run Security Scan**: Use tools like OWASP ZAP or Burp Suite
2. **Penetration Testing**: Basic penetration testing
3. **Load Testing**: Verify rate limiting under load
4. **Compatibility Testing**: Test across browsers and devices
5. **Backup Verification**: Ensure backup systems work
6. **Monitoring Setup**: Configure error tracking and alerts

### **Final Deployment Steps:**

1. **Environment Variables**: Set all secrets in deployment platform
2. **SSL Certificate**: Ensure HTTPS is working
3. **Domain Configuration**: Configure custom domain
4. **Monitoring**: Activate monitoring and alerting
5. **Documentation**: Update deployment documentation
6. **Team Training**: Train support team on new security measures

---

**⚠️ IMPORTANT: Do not deploy until all critical security fixes are implemented and tested! ⚠️**

*This action plan addresses the most critical security vulnerabilities. Additional security measures should be implemented based on the full audit checklist.*