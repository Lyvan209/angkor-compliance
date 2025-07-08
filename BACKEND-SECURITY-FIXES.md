# 🛡️ CRITICAL SECURITY FIXES - IMPLEMENTATION GUIDE

## 🚨 **IMMEDIATE ACTION REQUIRED**

### **Priority 1: Remove Hardcoded Secrets** ⏰ **NOW**

**Current Vulnerable Code:**
```javascript
// ❌ VULNERABLE - server.js:162
const JWT_SECRET = process.env.JWT_SECRET || 'UXXZIp4AZ/oP08ms2DWlv8/nQ9FtqrJBhOyzMtL7BHEZkSMlm6gv/J+e4G/OXmhUcX4MhWU9fYG1OE6XjPrP1A==';

// ❌ VULNERABLE - config/database.js:23-25
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**✅ SECURE IMPLEMENTATION:**
```javascript
// ✅ SECURE - Throw error if secrets missing
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration environment variables are required');
}

const JWT_SECRET = process.env.JWT_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
```

---

### **Priority 2: Fix SQL Injection** ⏰ **NOW**

**Current Vulnerable Code:**
```javascript
// ❌ VULNERABLE - scripts/deploy-database.js:78-79
const { data, error } = await supabase.rpc('exec_sql', {
    sql: cleanupSql  // Direct SQL string execution
});
```

**✅ SECURE IMPLEMENTATION:**
```javascript
// ✅ SECURE - Use parameterized queries
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', userId);  // Parameterized

// For complex queries, use prepared statements
const { data, error } = await supabase.rpc('safe_procedure', {
    param1: sanitizedValue1,
    param2: sanitizedValue2
});
```

---

### **Priority 3: Update Vulnerable Dependencies** ⏰ **NOW**

**Run These Commands:**
```bash
# Update all dependencies
npm update

# Fix security vulnerabilities
npm audit fix --force

# Verify fixes
npm audit --audit-level moderate
```

**Critical packages to update:**
- `lighthouse` → 12.7.1+
- `puppeteer` → 22.14.0+
- `ws` → 8.17.1+
- `tar-fs` → 3.0.9+

---

## 🔥 **HIGH PRIORITY FIXES** ⏰ **This Week**

### **Fix 1: Enhanced Input Validation**

**Install validator package:**
```bash
npm install validator joi
```

**Implementation:**
```javascript
const Joi = require('joi');
const validator = require('validator');

// Define schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
});

// Validation middleware
function validateInput(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: error.details[0].message 
            });
        }
        
        // Sanitize inputs
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = validator.escape(validator.trim(req.body[key]));
            }
        });
        
        next();
    };
}

// Usage
app.post('/api/auth/login', validateInput(loginSchema), async (req, res) => {
    // Now req.body is validated and sanitized
});
```

### **Fix 2: Secure Error Handling**

**Replace current error handlers:**
```javascript
// ❌ CURRENT - Leaks information
res.status(500).json({ 
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong'
});

// ✅ SECURE - No information leakage
function handleError(err, req, res, next) {
    // Log full error details securely
    logger.error('Application error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });
    
    // Return generic error to client
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;
    
    res.status(statusCode).json({
        error: 'Request failed',
        message: message,
        timestamp: new Date().toISOString(),
        requestId: req.id
    });
}
```

### **Fix 3: Strengthen Authentication**

**Enhanced JWT implementation:**
```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate secure JWT
function generateAccessToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        permissions: user.permissions || [],
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID() // Unique token ID for blacklisting
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: '1h',
        issuer: 'angkor-compliance',
        audience: 'angkor-compliance-api'
    });
}

// Token blacklist (use Redis in production)
const tokenBlacklist = new Set();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ error: 'Token has been revoked' });
    }

    jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'angkor-compliance',
        audience: 'angkor-compliance-api'
    }, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        req.token = token;
        next();
    });
}

// Logout with token blacklisting
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    tokenBlacklist.add(req.token);
    res.json({ message: 'Logged out successfully' });
});
```

---

## 🔒 **SECURITY HEADERS IMPLEMENTATION**

**Enhanced Helmet configuration:**
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://skqxzsrajcdmkbxembrs.supabase.co"],
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
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

---

## 🚫 **RATE LIMITING ENHANCEMENTS**

**Improved rate limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

// Redis client for distributed rate limiting
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
});

// Different limits for different endpoints
const createRateLimit = (windowMs, max, message) => rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:'
    }),
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true, // Important for production
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    }
});

// Apply different limits
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 5, 'Too many auth attempts'));
app.use('/api/contact', createRateLimit(60 * 60 * 1000, 3, 'Too many contact requests'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));
```

---

## 🧪 **TESTING THE FIXES**

**Security test script:**
```javascript
// test-security.js
const request = require('supertest');
const app = require('./server');

describe('Security Tests', () => {
    test('Should reject requests without JWT_SECRET', async () => {
        delete process.env.JWT_SECRET;
        expect(() => require('./server')).toThrow('JWT_SECRET environment variable is required');
    });
    
    test('Should sanitize input', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: '<script>alert("xss")</script>test@example.com',
                password: 'password123'
            });
        
        expect(response.status).toBe(400); // Should fail validation
    });
    
    test('Should rate limit requests', async () => {
        // Make multiple requests quickly
        const promises = Array(10).fill().map(() => 
            request(app).post('/api/auth/login').send({})
        );
        
        const responses = await Promise.all(promises);
        const rateLimited = responses.some(r => r.status === 429);
        expect(rateLimited).toBe(true);
    });
});
```

---

## 📋 **DEPLOYMENT CHECKLIST**

**Before deploying fixes:**

- [ ] **Environment Variables Set**
  - [ ] JWT_SECRET (strong, unique)
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY  
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] REDIS_URL (for rate limiting)

- [ ] **Dependencies Updated**
  - [ ] `npm audit` shows no high/critical issues
  - [ ] All packages updated to latest secure versions

- [ ] **Code Changes Applied**
  - [ ] Hardcoded secrets removed
  - [ ] Input validation implemented
  - [ ] Error handling secured
  - [ ] Authentication strengthened

- [ ] **Testing Completed**
  - [ ] Security tests pass
  - [ ] Authentication flow works
  - [ ] Rate limiting functions
  - [ ] Error handling doesn't leak info

- [ ] **Monitoring Ready**
  - [ ] Security logs configured
  - [ ] Alerting for failed auth attempts
  - [ ] Monitoring for unusual patterns

---

## 🚨 **POST-DEPLOYMENT VERIFICATION**

**Test these endpoints after deployment:**

```bash
# 1. Health check should work
curl https://angkorcompliance.com/api/health

# 2. Auth should require valid input
curl -X POST https://angkorcompliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'

# 3. Rate limiting should trigger
for i in {1..10}; do
  curl -X POST https://angkorcompliance.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"password"}'
done

# 4. XSS attempts should be blocked
curl -X POST https://angkorcompliance.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@test.com","message":"test"}'
```

---

**⚠️ CRITICAL: Do not deploy to production until ALL critical fixes are implemented and tested!** 