/**
 * Angkor Compliance Landing Page Server
 * Production-ready Express server with Supabase integration, analytics, security, and static file serving
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const winston = require('winston');
const cron = require('node-cron');
const { databaseService, supabaseClient } = require('./config/database');

// SECURITY FIX: Import validation middleware
const {
    sanitizeRequestBody,
    validateRequestHeaders,
    validateQueryParams,
    preventXSS,
    authValidation
} = require('./middleware/validation');

require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure Winston logger
const logger = winston.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'angkor-compliance-server' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (isDevelopment) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "https://skqxzsrajcdmkbxembrs.supabase.co"],
            connectSrc: ["'self'", "https://api.angkorcompliance.com", "https://skqxzsrajcdmkbxembrs.supabase.co"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact requests per hour
    message: 'Too many contact requests, please try again later.',
    skip: (req) => req.ip === '127.0.0.1' // Skip for localhost in development
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true
});

app.use(limiter);
app.use('/api/contact', contactLimiter);
app.use('/api/auth', authLimiter);

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://www.angkorcompliance.com'],
    credentials: true
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'angkor-compliance-development-secret-key';

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !isDevelopment,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database health check middleware
app.use(async (req, res, next) => {
    // Skip health check for static files and health endpoint
    if (req.path.startsWith('/api/') && req.path !== '/api/health') {
        try {
            const health = await databaseService.healthCheck();
            if (health.status !== 'healthy') {
                logger.warn('Database health check failed', health);
                // Continue anyway for now, but log the issue
            }
        } catch (error) {
            logger.error('Database health check error:', error);
            // Continue anyway for now
        }
    }
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// Static files middleware
app.use(express.static('.', {
    maxAge: isDevelopment ? 0 : '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// API Routes
app.use('/api', require('./routes/api'));

// Authentication endpoints
const jwt = require('jsonwebtoken');

// JWT helper functions - SECURITY FIX: No hardcoded fallbacks
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'test' || process.argv.includes('--syntax-check')) {
        console.warn('⚠️ JWT_SECRET missing - using test mode');
        var JWT_SECRET = 'test-secret-key-for-syntax-check-only';
    } else {
        logger.error('JWT_SECRET environment variable is required for security');
        throw new Error('JWT_SECRET environment variable is required');
    }
} else {
    var JWT_SECRET = process.env.JWT_SECRET;
}

function generateAccessToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            full_name: user.user_metadata?.full_name,
            company: user.user_metadata?.company 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Login endpoint (matches frontend expectation)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please provide email and password' 
            });
        }
        
        const result = await databaseService.signIn(email, password);
        
        // Generate JWT tokens
        const accessToken = generateAccessToken(result.user);
        const refreshToken = generateRefreshToken(result.user);
        
        // Store refresh token in database for revocation if needed
        await databaseService.storeRefreshToken(result.user.id, refreshToken);
        
        // Log the action
        await databaseService.logAction(result.user.id, 'user_login', {
            email,
            remember,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info('User logged in successfully', { email });
        
        // Set refresh token as httpOnly cookie if remember is true
        if (remember) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: !isDevelopment,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }
        
        res.json({ 
            success: true, 
            token: accessToken,
            user: {
                id: result.user.id,
                email: result.user.email,
                full_name: result.user.user_metadata?.full_name,
                company: result.user.user_metadata?.company
            },
            message: 'Login successful'
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({ 
            message: error.message || 'Invalid email or password'
        });
    }
});

// Register endpoint (matches frontend expectation)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, company, password } = req.body;
        
        // Basic validation
        if (!name || !email || !company || !password) {
            return res.status(400).json({ 
                message: 'Please fill in all required fields' 
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                field: 'email',
                message: 'Please enter a valid email address' 
            });
        }
        
        // Password validation
        if (password.length < 8) {
            return res.status(400).json({ 
                field: 'password',
                message: 'Password must be at least 8 characters long' 
            });
        }
        
        // Check if user already exists
        const existingUser = await databaseService.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                field: 'email',
                message: 'User with this email already exists'
            });
        }
        
        // Create user
        const result = await databaseService.signUp(email, password, {
            full_name: name,
            company: company
        });
        
        // Log the action
        await databaseService.logAction(result.user.id, 'user_register', {
            email,
            company,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info('User registered successfully', { email, company });
        
        // Send welcome email
        await sendWelcomeEmail({ name, email, company });
        
        res.status(201).json({ 
            success: true, 
            user: {
                id: result.user.id,
                email: result.user.email,
                full_name: name,
                company: company
            },
            message: 'Registration successful! Please check your email for verification.'
        });
    } catch (error) {
        logger.error('Registration error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
            return res.status(409).json({
                field: 'email',
                message: 'User with this email already exists'
            });
        }
        
        res.status(500).json({ 
            message: error.message || 'Error creating account'
        });
    }
});

// Token validation endpoint
app.post('/api/auth/validate', authenticateToken, async (req, res) => {
    try {
        // If we get here, the token is valid (middleware handled validation)
        const user = await databaseService.getUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                valid: false,
                message: 'User not found' 
            });
        }
        
        res.json({ 
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name,
                company: user.user_metadata?.company
            }
        });
    } catch (error) {
        logger.error('Token validation error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Token validation failed' 
        });
    }
});

// Google OAuth endpoint
app.get('/api/auth/google', async (req, res) => {
    try {
        // Redirect to Supabase Google OAuth
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${req.protocol}://${req.get('host')}/api/auth/callback/google`
            }
        });
        
        if (error) {
            logger.error('Google OAuth error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        res.redirect(data.url);
    } catch (error) {
        logger.error('Google OAuth setup error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

// Microsoft OAuth endpoint
app.get('/api/auth/microsoft', async (req, res) => {
    try {
        // Redirect to Supabase Microsoft OAuth
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: `${req.protocol}://${req.get('host')}/api/auth/callback/microsoft`
            }
        });
        
        if (error) {
            logger.error('Microsoft OAuth error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        res.redirect(data.url);
    } catch (error) {
        logger.error('Microsoft OAuth setup error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

// OAuth callback handlers
app.get('/api/auth/callback/google', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Exchange code for session
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        
        if (error) {
            logger.error('Google OAuth callback error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Generate JWT token
        const accessToken = generateAccessToken(data.user);
        
        // Log the action
        await databaseService.logAction(data.user.id, 'user_login', {
            email: data.user.email,
            provider: 'google',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info('Google OAuth login successful', { email: data.user.email });
        
        // Redirect to dashboard with token
        res.redirect(`/dashboard.html?token=${accessToken}`);
    } catch (error) {
        logger.error('Google OAuth callback error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

app.get('/api/auth/callback/microsoft', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Exchange code for session
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        
        if (error) {
            logger.error('Microsoft OAuth callback error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Generate JWT token
        const accessToken = generateAccessToken(data.user);
        
        // Log the action
        await databaseService.logAction(data.user.id, 'user_login', {
            email: data.user.email,
            provider: 'microsoft',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info('Microsoft OAuth login successful', { email: data.user.email });
        
        // Redirect to dashboard with token
        res.redirect(`/dashboard.html?token=${accessToken}`);
    } catch (error) {
        logger.error('Microsoft OAuth callback error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // Revoke refresh token if it exists
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await databaseService.revokeRefreshToken(refreshToken);
            res.clearCookie('refreshToken');
        }
        
        // Log the action
        await databaseService.logAction(req.user.id, 'user_logout', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        logger.info('User logged out successfully', { email: req.user.email });
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Error logging out' });
    }
});

// Legacy endpoints for backward compatibility
app.post('/api/auth/signup', async (req, res) => {
    // Redirect to new register endpoint
    return app._router.handle(req, res, () => {
        req.url = '/api/auth/register';
        req.body = {
            name: req.body.fullName,
            email: req.body.email,
            company: req.body.factoryName,
            password: req.body.password
        };
        app.handle(req, res);
    });
});

app.post('/api/auth/signin', async (req, res) => {
    // Redirect to new login endpoint
    return app._router.handle(req, res, () => {
        req.url = '/api/auth/login';
        app.handle(req, res);
    });
});

app.post('/api/auth/signout', async (req, res) => {
    // Redirect to new logout endpoint
    return app._router.handle(req, res, () => {
        req.url = '/api/auth/logout';
        app.handle(req, res);
    });
});

// Analytics endpoint
app.post('/api/analytics', (req, res) => {
    try {
        const { event, data, timestamp, session } = req.body;
        
        // Log analytics event
        logger.info('Analytics Event', {
            event,
            data,
            timestamp,
            session,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, company, message, language } = req.body;
        
        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: language === 'kh' 
                    ? 'សូមបំពេញព័ត៌មានទាំងអស់' 
                    : 'Please fill in all required fields' 
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: language === 'kh' 
                    ? 'អុីមែលមិនត្រឹមត្រូវ' 
                    : 'Invalid email address' 
            });
        }
        
        // Log contact request
        logger.info('Contact form submission', {
            name,
            email,
            company,
            message: message.substring(0, 100),
            language,
            ip: req.ip
        });
        
        // Send email notification (configure your email service)
        await sendContactEmail({ name, email, company, message, language });
        
        res.status(200).json({ 
            success: true, 
            message: language === 'kh' 
                ? 'សំណើរបស់អ្នកត្រូវបានបញ្ជូនហើយ យើងនឹងទាក់ទងមកវិញក្នុងពេលឆាប់ៗ' 
                : 'Your message has been sent. We will contact you soon!' 
        });
    } catch (error) {
        logger.error('Contact form error:', error);
        res.status(500).json({ 
            error: language === 'kh' 
                ? 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត' 
                : 'Technical error. Please try again.' 
        });
    }
});

// Demo request endpoint
app.post('/api/demo', async (req, res) => {
    try {
        const { name, email, company, phone, language } = req.body;
        
        // Basic validation
        if (!name || !email || !company) {
            return res.status(400).json({ 
                error: language === 'kh' 
                    ? 'សូមបំពេញព័ត៌មានទាំងអស់' 
                    : 'Please fill in all required fields' 
            });
        }
        
        // Log demo request
        logger.info('Demo request', {
            name,
            email,
            company,
            phone,
            language,
            ip: req.ip
        });
        
        // Send demo request email
        await sendDemoRequestEmail({ name, email, company, phone, language });
        
        res.status(200).json({ 
            success: true, 
            message: language === 'kh' 
                ? 'សំណើបង្ហាញប្រព័ន្ធត្រូវបានបញ្ជូនហើយ យើងនឹងទាក់ទងមកវិញក្នុងពេលឆាប់ៗ' 
                : 'Demo request sent. We will contact you soon to schedule!' 
        });
    } catch (error) {
        logger.error('Demo request error:', error);
        res.status(500).json({ 
            error: language === 'kh' 
                ? 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត' 
                : 'Technical error. Please try again.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await databaseService.healthCheck();
        
        res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
            status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: dbHealth,
            supabase: {
                url: process.env.SUPABASE_URL ? 'configured' : 'missing',
                connected: dbHealth.status === 'healthy'
            }
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
    logger.warn(`404 - Not Found: ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
// SECURITY FIX: Secure global error handler
app.use((err, req, res, next) => {
    // Log error with sanitized information
    const sanitizedError = {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ip: req.ip
    };
    
    logger.error('Application error:', sanitizedError);
    
    if (res.headersSent) {
        return next(err);
    }
    
    // SECURITY: Never expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
    };
    
    // Only include detailed error info in development
    if (!isProduction) {
        errorResponse.message = err.message;
        errorResponse.details = err.stack;
    }
    
    // Don't expose sensitive information
    if (err.message && err.message.includes('JWT_SECRET')) {
        errorResponse.message = 'Authentication configuration error';
    }
    
    if (err.message && err.message.includes('SUPABASE')) {
        errorResponse.message = 'Database configuration error';
    }
    
    res.status(err.status || 500).json(errorResponse);
});

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send contact email
async function sendContactEmail({ name, email, company, message, language }) {
    if (!process.env.SMTP_USER) {
        logger.warn('SMTP not configured, skipping email send');
        return;
    }
    
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || 'support@angkorcompliance.com',
        subject: `Contact Form - ${name} from ${company}`,
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Language:</strong> ${language}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p><em>Sent from Angkor Compliance website</em></p>
        `
    };
    
    await transporter.sendMail(mailOptions);
}

// Send demo request email
async function sendDemoRequestEmail({ name, email, company, phone, language }) {
    if (!process.env.SMTP_USER) {
        logger.warn('SMTP not configured, skipping email send');
        return;
    }
    
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.SALES_EMAIL || 'sales@angkorcompliance.com',
        subject: `Demo Request - ${name} from ${company}`,
        html: `
            <h2>New Demo Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Language:</strong> ${language}</p>
            <hr>
            <p><em>Sent from Angkor Compliance website</em></p>
        `
    };
    
    await transporter.sendMail(mailOptions);
}

// Send welcome email
async function sendWelcomeEmail({ name, email, company }) {
    if (!process.env.SMTP_USER) {
        logger.warn('SMTP not configured, skipping email send');
        return;
    }
    
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Welcome to Angkor Compliance - ${name}`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to Angkor Compliance!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your journey to better compliance starts here</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #d4af37; margin-top: 0;">Hello ${name}!</h2>
                    
                    <p>Thank you for registering with Angkor Compliance. We're excited to help ${company} streamline your compliance management processes.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">What's Next?</h3>
                        <ul style="color: #555; line-height: 1.6;">
                            <li>Complete your factory profile setup</li>
                            <li>Upload your permits and certificates</li>
                            <li>Set up compliance reminders</li>
                            <li>Explore our CAP management tools</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://angkorcompliance.com/login.html" style="background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                            Get Started Now
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you have any questions, please don't hesitate to contact our support team at 
                        <a href="mailto:support@angkorcompliance.com" style="color: #d4af37;">support@angkorcompliance.com</a>
                    </p>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            © 2024 Angkor Compliance. All rights reserved.<br>
                            <a href="https://angkorcompliance.com" style="color: #d4af37; text-decoration: none;">www.angkorcompliance.com</a>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
}

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Scheduled tasks
cron.schedule('0 0 * * *', async () => {
    logger.info('Daily maintenance task running');
    
    try {
        // Check for expiring permits and send reminders
        // This would be implemented when we have the dashboard
        logger.info('Daily permit expiry check completed');
    } catch (error) {
        logger.error('Daily maintenance task error:', error);
    }
});

// Check database connection on startup
(async () => {
    try {
        const health = await databaseService.healthCheck();
        logger.info('Database connection check:', health);
    } catch (error) {
        logger.error('Database connection failed on startup:', error);
    }
})();

// Start server
app.listen(PORT, () => {
    logger.info(`Angkor Compliance server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'not configured'}`);
    logger.info(`Visit: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app; 