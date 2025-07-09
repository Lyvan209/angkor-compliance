import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// JWT helper function
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

export const handler = async (event, _context) => {
    // Enhanced CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Enhanced path handling - check both path and query parameters
        let path = event.path.replace('/.netlify/functions/auth', '');
        
        // Handle query parameter routing (from redirects)
        if (event.queryStringParameters && event.queryStringParameters.path) {
            path = event.queryStringParameters.path;
        }
        
        // Default to login if no path specified
        if (!path || path === '/') {
            path = '/login';
        }

        const method = event.httpMethod;
        
        // Enhanced logging
        console.log('Auth function called:', {
            path,
            method,
            originalPath: event.path,
            query: event.queryStringParameters,
            hasBody: !!event.body
        });

        // Parse body if present
        let body = {};
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                console.error('Body parsing error:', e);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Invalid JSON in request body'
                    })
                };
            }
        }

        // Login endpoint
        if (path === '/login' && method === 'POST') {
            console.log('Processing login request');
            
            const { email, password } = body;
            
            if (!email || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        message: 'Please provide email and password' 
                    })
                };
            }
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('Supabase login error:', error);
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        message: error.message || 'Invalid email or password'
                    })
                };
            }
            
            // Generate JWT token
            const accessToken = generateAccessToken(data.user);
            
            console.log('Login successful for:', email);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    token: accessToken,
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.user_metadata?.full_name,
                        company: data.user.user_metadata?.company
                    },
                    message: 'Login successful'
                })
            };
        }

        // Register endpoint
        if (path === '/register' && method === 'POST') {
            console.log('Processing register request');
            
            const { name, email, company, password } = body;
            
            // Basic validation
            if (!name || !email || !company || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        message: 'Please fill in all required fields' 
                    })
                };
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
                console.error('Supabase register error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        message: error.message || 'Error creating account'
                    })
                };
            }
            
            console.log('Registration successful for:', email);
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        full_name: name,
                        company: company
                    },
                    message: 'Registration successful! Please check your email for verification.'
                })
            };
        }

        // Token validation endpoint
        if (path === '/validate' && method === 'POST') {
            console.log('Processing token validation');
            
            const authHeader = event.headers.authorization || event.headers.Authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        valid: false,
                        message: 'Access token required' 
                    })
                };
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        valid: true,
                        user: decoded
                    })
                };
            } catch (error) {
                console.error('Token validation error:', error);
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ 
                        valid: false,
                        message: 'Invalid or expired token' 
                    })
                };
            }
        }

        // Health check
        if (path === '/health' && method === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: 'healthy', 
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    supabase: {
                        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
                        key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing'
                    }
                })
            };
        }

        // 404 for unmatched routes
        console.error('Route not found:', { path, method });
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
                error: 'Not found',
                message: 'API endpoint not found',
                path: path,
                method: method,
                debug: {
                    originalPath: event.path,
                    queryParams: event.queryStringParameters
                }
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
}; 