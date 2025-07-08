const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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

exports.handler = async (event, context) => {
    // CORS headers
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
        const path = event.path.replace('/.netlify/functions/auth', '');
        const method = event.httpMethod;
        
        // Parse body if present
        let body = {};
        if (event.body) {
            body = JSON.parse(event.body);
        }

        // Login endpoint
        if (path === '/login' && method === 'POST') {
            const { email, password, remember } = body;
            
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
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        message: error.message || 'Error creating account'
                    })
                };
            }
            
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

        // Health check
        if (path === '/health' && method === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: 'healthy', 
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development'
                })
            };
        }

        // 404 for unmatched routes
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
                error: 'Not found',
                message: 'API endpoint not found',
                path: path,
                method: method
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message
            })
        };
    }
}; 