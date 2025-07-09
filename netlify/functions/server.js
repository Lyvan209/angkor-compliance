import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "https://skqxzsrajcdmkbxembrs.supabase.co"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://angkorcompliance.com', 'https://www.angkorcompliance.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Initialize admin client for server-side operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
) : null;

// JWT helper functions
function generateAccessToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            full_name: user.user_metadata?.full_name,
            company: user.user_metadata?.company 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
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

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Helper function to get user by email
async function getUserByEmail(email) {
    try {
        if (!supabaseAdmin) {
            throw new Error('Admin client not available');
        }
        
        const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        
        if (error) {
            if (error.message.includes('User not found')) {
                return null;
            }
            throw error;
        }
        
        return data.user;
    } catch (error) {
        if (error.message.includes('User not found')) {
            return null;
        }
        throw error;
    }
}

// Helper function to get user by ID
async function getUserById(userId) {
    try {
        if (!supabaseAdmin) {
            throw new Error('Admin client not available');
        }
        
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (error) {
            if (error.message.includes('User not found')) {
                return null;
            }
            throw error;
        }
        
        return data.user;
    } catch (error) {
        if (error.message.includes('User not found')) {
            return null;
        }
        throw error;
    }
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please provide email and password' 
            });
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(401).json({ 
                message: error.message || 'Invalid email or password'
            });
        }
        
        // Generate JWT tokens
        const accessToken = generateAccessToken(data.user);
        const refreshToken = generateRefreshToken(data.user);
        
        // Set refresh token as httpOnly cookie if remember is true
        if (remember) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }
        
        res.json({ 
            success: true, 
            token: accessToken,
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name,
                company: data.user.user_metadata?.company
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ 
            message: error.message || 'Invalid email or password'
        });
    }
});

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
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                field: 'email',
                message: 'User with this email already exists'
            });
        }
        
        // Create user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    company: company
                }
            }
        });
        
        if (error) {
            // Handle specific Supabase errors
            if (error.message.includes('already registered')) {
                return res.status(409).json({
                    field: 'email',
                    message: 'User with this email already exists'
                });
            }
            
            return res.status(500).json({ 
                message: error.message || 'Error creating account'
            });
        }
        
        res.status(201).json({ 
            success: true, 
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: name,
                company: company
            },
            message: 'Registration successful! Please check your email for verification.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: error.message || 'Error creating account'
        });
    }
});

app.post('/api/auth/validate', authenticateToken, async (req, res) => {
    try {
        // If we get here, the token is valid (middleware handled validation)
        const user = await getUserById(req.user.id);
        
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
        console.error('Token validation error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Token validation failed' 
        });
    }
});

app.get('/api/auth/google', async (req, res) => {
    try {
        // Redirect to Supabase Google OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${req.protocol}://${req.get('host')}/api/auth/callback/google`
            }
        });
        
        if (error) {
            console.error('Google OAuth error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        res.redirect(data.url);
    } catch (error) {
        console.error('Google OAuth setup error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

app.get('/api/auth/microsoft', async (req, res) => {
    try {
        // Redirect to Supabase Microsoft OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: `${req.protocol}://${req.get('host')}/api/auth/callback/microsoft`
            }
        });
        
        if (error) {
            console.error('Microsoft OAuth error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        res.redirect(data.url);
    } catch (error) {
        console.error('Microsoft OAuth setup error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

app.get('/api/auth/callback/google', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
            console.error('Google OAuth callback error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Generate JWT token
        const accessToken = generateAccessToken(data.user);
        
        // Redirect to dashboard with token
        res.redirect(`/dashboard.html?token=${accessToken}`);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
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
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
            console.error('Microsoft OAuth callback error:', error);
            return res.redirect('/login.html?error=oauth_error');
        }
        
        // Generate JWT token
        const accessToken = generateAccessToken(data.user);
        
        // Redirect to dashboard with token
        res.redirect(`/dashboard.html?token=${accessToken}`);
    } catch (error) {
        console.error('Microsoft OAuth callback error:', error);
        res.redirect('/login.html?error=oauth_error');
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // Clear refresh token cookie
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            res.clearCookie('refreshToken');
        }
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Error logging out' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, company, message, language } = req.body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: language === 'kh' ? 'ពត៌មានមិនគ្រប់គ្រាន់' : 'Missing required information'
            });
        }
        
        // Store in database
        const { data, error } = await supabase
            .from('contacts')
            .insert([
                {
                    name,
                    email,
                    company,
                    message,
                    language: language || 'en',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ 
                error: 'Failed to save contact',
                message: language === 'kh' ? 'មិនអាចរក្សាទុកព័ត៌មាន' : 'Failed to save information'
            });
        }

        res.json({ 
            success: true, 
            message: language === 'kh' ? 'សារត្រូវបានផ្ញើដោយជោគជ័យ' : 'Message sent successfully',
            data: data[0]
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: req.body.language === 'kh' ? 'កំហុសម៉ាស៊ីនមេ' : 'Server error occurred'
        });
    }
});

// Demo request endpoint
app.post('/api/demo', async (req, res) => {
    try {
        const { name, email, company, phone, factorySize, language } = req.body;
        
        if (!name || !email || !company) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: language === 'kh' ? 'ពត៌មានមិនគ្រប់គ្រាន់' : 'Missing required information'
            });
        }
        
        // Store in database
        const { data, error } = await supabase
            .from('demo_requests')
            .insert([
                {
                    name,
                    email,
                    company,
                    phone,
                    factory_size: factorySize,
                    language: language || 'en',
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ 
                error: 'Failed to save demo request',
                message: language === 'kh' ? 'មិនអាចរក្សាទុកសំណើ' : 'Failed to save request'
            });
        }

        res.json({ 
            success: true, 
            message: language === 'kh' ? 'សំណើសាកល្បងត្រូវបានផ្ញើ' : 'Demo request submitted successfully',
            data: data[0]
        });

    } catch (error) {
        console.error('Demo request error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: req.body.language === 'kh' ? 'កំហុសម៉ាស៊ីនមេ' : 'Server error occurred'
        });
    }
});

// Testimonials endpoint
app.get('/api/testimonials', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ 
                error: 'Failed to fetch testimonials'
            });
        }

        res.json({ 
            success: true, 
            data: data || []
        });

    } catch (error) {
        console.error('Testimonials error:', error);
        res.status(500).json({ 
            error: 'Server error'
        });
    }
});

// Analytics endpoint
app.post('/api/analytics', async (req, res) => {
    try {
        const { event, data, language } = req.body;
        
        // Store analytics data
        const { error } = await supabase
            .from('analytics')
            .insert([
                {
                    event,
                    data: data || {},
                    language: language || 'en',
                    user_agent: req.headers['user-agent'],
                    ip_address: req.ip,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('Analytics error:', error);
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Analytics error:', error);
        res.json({ success: false });
    }
});

// Error handling middleware
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: 'API endpoint not found'
    });
});

// Export serverless function handler
export const handler = serverless(app); 