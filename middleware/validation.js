/**
 * SECURITY FIX: Input Validation and Sanitization Middleware
 * Comprehensive validation for all API endpoints
 */

const validator = require('validator');
const { body, validationResult } = require('express-validator');

// SECURITY: Input sanitization function
function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    
    // Trim whitespace and escape HTML characters
    let sanitized = validator.trim(value);
    sanitized = validator.escape(sanitized);
    
    return sanitized;
}

// SECURITY: Sanitize all string inputs in request body
function sanitizeRequestBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(req.body[key]);
            }
        });
    }
    next();
}

// SECURITY: Validation error handler
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
}

// SECURITY: Authentication validation schemas
const authValidation = {
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Password must be between 8 and 128 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        handleValidationErrors
    ],
    
    register: [
        body('name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters')
            .matches(/^[a-zA-Z\s\u1780-\u17FF]+$/)
            .withMessage('Name can only contain letters and spaces (including Khmer characters)'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('company')
            .isLength({ min: 2, max: 200 })
            .withMessage('Company name must be between 2 and 200 characters')
            .matches(/^[a-zA-Z0-9\s\u1780-\u17FF\-&.,()]+$/)
            .withMessage('Company name contains invalid characters'),
        body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Password must be between 8 and 128 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        handleValidationErrors
    ]
};

// SECURITY: Contact form validation
const contactValidation = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\u1780-\u17FF]+$/)
        .withMessage('Name can only contain letters and spaces'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('company')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Company name must be less than 200 characters'),
    body('message')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters')
        .matches(/^[a-zA-Z0-9\s\u1780-\u17FF\-.,!?()'"]+$/)
        .withMessage('Message contains invalid characters'),
    body('language')
        .optional()
        .isIn(['en', 'km', 'kh'])
        .withMessage('Language must be en, km, or kh'),
    handleValidationErrors
];

// SECURITY: Support ticket validation
const supportValidation = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('subject')
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters'),
    body('message')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Message must be between 10 and 5000 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    body('category')
        .optional()
        .isIn(['technical', 'billing', 'general', 'feature'])
        .withMessage('Invalid category'),
    handleValidationErrors
];

// SECURITY: File upload validation
function validateFileUpload(allowedTypes = [], maxSize = 10 * 1024 * 1024) {
    return (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const file = req.file;
        
        // Check file size
        if (file.size > maxSize) {
            return res.status(400).json({ 
                error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
            });
        }
        
        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ 
                error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
            });
        }
        
        // Sanitize filename
        file.originalname = validator.escape(file.originalname);
        
        next();
    };
}

// SECURITY: Rate limit bypass protection
function validateRequestHeaders(req, res, next) {
    // Remove potential proxy headers that could bypass rate limiting
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-real-ip'];
    delete req.headers['x-client-ip'];
    
    // Validate User-Agent
    if (req.headers['user-agent'] && req.headers['user-agent'].length > 500) {
        req.headers['user-agent'] = req.headers['user-agent'].substring(0, 500);
    }
    
    next();
}

// SECURITY: SQL injection prevention for query parameters
function validateQueryParams(req, res, next) {
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            const value = req.query[key];
            if (typeof value === 'string') {
                // Check for SQL injection patterns
                const sqlPatterns = [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
                    /(union|--|\*|;)/i,
                    /(\|\||&&)/,
                    /script:/i
                ];
                
                for (const pattern of sqlPatterns) {
                    if (pattern.test(value)) {
                        return res.status(400).json({ 
                            error: 'Invalid query parameter detected' 
                        });
                    }
                }
                
                // Sanitize the parameter
                req.query[key] = sanitizeInput(value);
            }
        });
    }
    next();
}

// SECURITY: XSS prevention for request body
function preventXSS(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            const value = req.body[key];
            if (typeof value === 'string') {
                // Check for XSS patterns
                const xssPatterns = [
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /<iframe/gi,
                    /<object/gi,
                    /<embed/gi
                ];
                
                for (const pattern of xssPatterns) {
                    if (pattern.test(value)) {
                        return res.status(400).json({ 
                            error: 'Potential XSS attempt detected' 
                        });
                    }
                }
            }
        });
    }
    next();
}

module.exports = {
    sanitizeInput,
    sanitizeRequestBody,
    handleValidationErrors,
    authValidation,
    contactValidation,
    supportValidation,
    validateFileUpload,
    validateRequestHeaders,
    validateQueryParams,
    preventXSS
}; 