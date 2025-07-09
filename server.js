/**
 * Angkor Compliance Landing Page Server
 * Production-ready Express server with Supabase integration, analytics, security, and static file serving
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Security middleware
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

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://www.angkorcompliance.com'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// In-memory session store (use Redis in production)
const sessions = new Map();

// Session management functions
function generateSessionId() {
    return crypto.randomUUID();
}

function storeSession(sessionId, userData) {
    sessions.set(sessionId, {
        user: userData,
        createdAt: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    });
}

function getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    if (Date.now() > session.expiresAt) {
        sessions.delete(sessionId);
        return null;
    }
    
    return session.user;
}

function invalidateSession(sessionId) {
    sessions.delete(sessionId);
}

// Session validation middleware
async function validateSession(req, res, next) {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
        return res.status(401).json({ error: 'No session' });
    }
    
    try {
        const user = getSession(sessionId);
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
}

// Input validation middleware
const { body, validationResult } = require('express-validator');

const emailValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .custom(value => {
            if (value.includes('..')) {
                throw new Error('Invalid email format');
            }
            if (value.includes(' ')) {
                throw new Error('Email cannot contain spaces');
            }
            return true;
        })
        .withMessage('Please provide a valid email address')
];

const passwordValidation = [
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Authentication endpoints
app.post('/api/auth/register', 
    emailValidation,
    passwordValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { name, email, company, password } = req.body;

            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                return res.status(400).json({
                    error: 'User already exists',
                    field: 'email',
                    message: 'An account with this email already exists'
                });
            }

            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        company: company
                    }
                }
            });

            if (authError) {
                return res.status(400).json({
                    error: 'Registration failed',
                    message: authError.message
                });
            }

            // Create user profile in database
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: name,
                    company: company,
                    role: 'user'
                });

            if (profileError) {
                return res.status(500).json({
                    error: 'Profile creation failed',
                    message: 'Failed to create user profile'
                });
            }

            res.status(201).json({
                message: 'Registration successful. Please check your email for verification.'
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Registration failed',
                message: 'Internal server error'
            });
        }
    }
);

app.post('/api/auth/login',
    emailValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Authenticate with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: 'Invalid email or password'
                });
            }

            // Generate session
            const sessionId = generateSessionId();
            storeSession(sessionId, data.user);

            // Set secure httpOnly cookie
            res.cookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000, // 1 hour
                path: '/'
            });

            res.json({
                message: 'Login successful',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed',
                message: 'Internal server error'
            });
        }
    }
);

// OAuth endpoints
app.get('/api/auth/google', (req, res) => {
    const { data, error } = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback/google`
        }
    });

    if (error) {
        return res.status(500).json({ error: 'OAuth initiation failed' });
    }

    res.redirect(data.url);
});

app.get('/api/auth/callback/google', async (req, res) => {
    try {
        const { code } = req.query;
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) throw error;
        
        // Generate session
        const sessionId = generateSessionId();
        storeSession(sessionId, data.user);
        
        // Set secure cookie
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

// Session validation endpoint
app.get('/api/auth/validate', validateSession, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Logout endpoint
app.post('/api/auth/logout', validateSession, async (req, res) => {
    try {
        await invalidateSession(req.cookies.sessionId);
        res.clearCookie('sessionId');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Dashboard endpoints (protected)
app.get('/api/dashboard/overview', validateSession, async (req, res) => {
    try {
        // Get user's factory data
        const { data: factories } = await supabase
            .from('factories')
            .select('*')
            .eq('user_id', req.user.id);

        // Get permits
        const { data: permits } = await supabase
            .from('permits')
            .select('*')
            .eq('factory_id', factories?.[0]?.id || 0);

        // Get CAPs
        const { data: caps } = await supabase
            .from('corrective_action_plans')
            .select('*')
            .eq('factory_id', factories?.[0]?.id || 0);

        const stats = {
            totalFactories: factories?.length || 0,
            activePermits: permits?.filter(p => p.status === 'active').length || 0,
            totalPermits: permits?.length || 0,
            openCaps: caps?.filter(c => c.status === 'open').length || 0,
            totalCaps: caps?.length || 0,
            upcomingDeadlines: 0, // Calculate based on permit expiry dates
            totalDocuments: 0,
            totalReminders: 0
        };

        res.json({
            stats,
            factories,
            recentActivity: []
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security features enabled`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 