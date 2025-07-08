/**
 * API Routes for Angkor Compliance
 * Additional API endpoints for the landing page
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'angkor-compliance-api' },
    transports: [
        new winston.transports.File({ filename: 'logs/api.log' })
    ]
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many API requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

router.use(apiLimiter);

// Middleware to log API requests
router.use((req, res, next) => {
    logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' ? req.body : undefined
    });
    next();
});

// Get company information
router.get('/company', (req, res) => {
    const companyInfo = {
        name: 'Angkor Compliance',
        description: {
            en: 'Professional compliance management for Cambodian garment factories',
            kh: 'ការគ្រប់គ្រងការអនុលោមតាមបច្ចេកទេសសម្រាប់រោងចក្រកាត់ដេរកម្ពុជា'
        },
        founded: '2024',
        headquarters: 'Phnom Penh, Cambodia',
        website: 'https://www.angkorcompliance.com',
        contact: {
            email: 'info@angkorcompliance.com',
            phone: '+855 12 345 678',
            address: {
                en: '123 Business Street, Phnom Penh, Cambodia',
                kh: '១២៣ ផ្លូវអាជីវកម្ម ភ្នំពេញ កម្ពុជា'
            }
        },
        socialMedia: {
            facebook: 'https://facebook.com/angkorcompliance',
            linkedin: 'https://linkedin.com/company/angkorcompliance',
            twitter: 'https://twitter.com/angkorcompliance'
        }
    };
    
    res.json(companyInfo);
});

// Get features list
router.get('/features', (req, res) => {
    const features = [
        {
            id: 'permits-certificates',
            name: {
                en: 'Permits & Certificates',
                kh: 'លិខិតអនុញ្ញាត និងសម្បុត្រ'
            },
            description: {
                en: 'Track expiration dates, renewal requirements, and maintain complete documentation.',
                kh: 'តាមដានកាលបរិច្ឆេទផុតកំណត់ តម្រូវការបន្ត និងរក្សាទុកឯកសារពេញលេញ។'
            },
            icon: 'certificate',
            category: 'documentation'
        },
        {
            id: 'corrective-action-plans',
            name: {
                en: 'Corrective Action Plans',
                kh: 'ផែនការកែតម្រូវ'
            },
            description: {
                en: 'Create, assign, and monitor CAPs with automated reminders and progress tracking.',
                kh: 'បង្កើត កំណត់ និងតាមដានផែនការកែតម្រូវ ជាមួយនឹងការរំលឹកស្វ័យប្រវត្តិ។'
            },
            icon: 'clipboard-check',
            category: 'management'
        },
        {
            id: 'grievance-management',
            name: {
                en: 'Grievance Management',
                kh: 'ការគ្រប់គ្រងបណ្តឹងតវ៉ា'
            },
            description: {
                en: 'Log, investigate, and resolve worker grievances with complete audit trails.',
                kh: 'កត់ត្រា ស៊ើបអង្កេត និងដោះស្រាយបណ្តឹងតវ៉ារបស់កម្មករ។'
            },
            icon: 'user-shield',
            category: 'hr'
        },
        {
            id: 'smart-reminders',
            name: {
                en: 'Smart Reminders',
                kh: 'ការរំលឹកឆ្លាតវៃ'
            },
            description: {
                en: 'Never miss important deadlines with intelligent calendar-based reminders.',
                kh: 'មិនត្រូវខកខានកាលបរិច្ឆេទសំខាន់ៗ ជាមួយនឹងការរំលឹកឆ្លាតវៃ។'
            },
            icon: 'bell',
            category: 'automation'
        },
        {
            id: 'committee-management',
            name: {
                en: 'Committee Management',
                kh: 'ការគ្រប់គ្រងគណៈកម្មការ'
            },
            description: {
                en: 'Organize internal committees, schedule meetings, and track decisions.',
                kh: 'រៀបចំគណៈកម្មការផ្ទៃក្នុង កំណត់ពេលប្រជុំ និងតាមដានការសម្រេចចិត្ត។'
            },
            icon: 'users',
            category: 'organization'
        },
        {
            id: 'analytics-reporting',
            name: {
                en: 'Analytics & Reporting',
                kh: 'ការវិភាគ និងរបាយការណ៍'
            },
            description: {
                en: 'Generate comprehensive reports and analytics to track compliance performance.',
                kh: 'បង្កើតរបាយការណ៍ និងការវិភាគពេញលេញដើម្បីតាមដានកេរ្តិ៍ដំណែលអនុលោមតាម។'
            },
            icon: 'chart-bar',
            category: 'analytics'
        }
    ];
    
    res.json(features);
});

// Get pricing information
router.get('/pricing', (req, res) => {
    const pricing = {
        plans: [
            {
                id: 'starter',
                name: {
                    en: 'Starter',
                    kh: 'ចាប់ផ្តើម'
                },
                price: {
                    monthly: 99,
                    yearly: 999
                },
                currency: 'USD',
                features: [
                    'permits-certificates',
                    'smart-reminders',
                    'basic-reporting'
                ],
                limits: {
                    users: 5,
                    documents: 100,
                    storage: '1GB'
                }
            },
            {
                id: 'professional',
                name: {
                    en: 'Professional',
                    kh: 'វិជ្ជាជីវៈ'
                },
                price: {
                    monthly: 199,
                    yearly: 1999
                },
                currency: 'USD',
                features: [
                    'permits-certificates',
                    'corrective-action-plans',
                    'grievance-management',
                    'smart-reminders',
                    'committee-management',
                    'advanced-reporting'
                ],
                limits: {
                    users: 25,
                    documents: 1000,
                    storage: '10GB'
                },
                popular: true
            },
            {
                id: 'enterprise',
                name: {
                    en: 'Enterprise',
                    kh: 'សហគ្រាស'
                },
                price: {
                    monthly: 499,
                    yearly: 4999
                },
                currency: 'USD',
                features: [
                    'permits-certificates',
                    'corrective-action-plans',
                    'grievance-management',
                    'smart-reminders',
                    'committee-management',
                    'analytics-reporting',
                    'api-access',
                    'custom-integrations',
                    'priority-support'
                ],
                limits: {
                    users: 'unlimited',
                    documents: 'unlimited',
                    storage: '100GB'
                }
            }
        ],
        currencies: ['USD', 'KHR'],
        trialDays: 14
    };
    
    res.json(pricing);
});

// Get testimonials
router.get('/testimonials', (req, res) => {
    const testimonials = [
        {
            id: 1,
            name: 'Sophea Chan',
            title: {
                en: 'HR Manager',
                kh: 'អ្នកគ្រប់គ្រងធនធានមនុស្ស'
            },
            company: 'Mekong Garments Co.',
            rating: 5,
            testimonial: {
                en: 'Angkor Compliance has revolutionized how we manage our factory compliance. The bilingual interface makes it perfect for our team.',
                kh: 'Angkor Compliance បានផ្លាស់ប្តូររបៀបដែលយើងគ្រប់គ្រងការអនុលោមតាមច្បាប់រោងចក្រ។ ចំណុចប្រទាក់ភាសាទ្វេធ្វើឱ្យវាល្អឥតខ្ចោះសម្រាប់ក្រុមរបស់យើង។'
            },
            image: '/testimonials/sophea-chan.jpg',
            date: '2024-01-15'
        },
        {
            id: 2,
            name: 'David Kim',
            title: {
                en: 'Compliance Officer',
                kh: 'មន្រ្តីអនុលោមតាម'
            },
            company: 'Angkor Textiles Ltd.',
            rating: 5,
            testimonial: {
                en: 'The CAP management feature has saved us countless hours and improved our audit readiness significantly.',
                kh: 'មុខងារគ្រប់គ្រងផែនការកែតម្រូវបានសង្គ្រោះយើងពេលវេលារាប់មិនអស់ និងបានកែលម្អការត្រៀមខ្លួនសម្រាប់ការត្រួតពិនិត្យយ៉ាងខ្លាំង។'
            },
            image: '/testimonials/david-kim.jpg',
            date: '2024-02-20'
        },
        {
            id: 3,
            name: 'Pich Sophany',
            title: {
                en: 'Factory Manager',
                kh: 'អ្នកគ្រប់គ្រងរោងចក្រ'
            },
            company: 'Royal Garments Factory',
            rating: 4,
            testimonial: {
                en: 'Excellent system for tracking permits and certificates. The reminder system ensures we never miss renewal deadlines.',
                kh: 'ប្រព័ន្ធល្អឥតខ្ចោះសម្រាប់តាមដានលិខិតអនុញ្ញាត និងសម្បុត្រ។ ប្រព័ន្ធរំលឹកធានាថាយើងមិនខកខានកាលបរិច្ឆេទបន្តទេ។'
            },
            image: '/testimonials/pich-sophany.jpg',
            date: '2024-03-10'
        }
    ];
    
    res.json(testimonials);
});

// Get blog posts / news
router.get('/blog', (req, res) => {
    const blogPosts = [
        {
            id: 1,
            title: {
                en: 'New Cambodian Labor Law Updates 2024',
                kh: 'ការធ្វើឱ្យទាន់សម័យច្បាប់ការងារកម្ពុជាថ្មី ២០២៤'
            },
            excerpt: {
                en: 'Learn about the latest updates to Cambodian labor laws and how they affect garment factories.',
                kh: 'ស្វែងយល់អំពីការធ្វើឱ្យទាន់សម័យថ្មីៗនៃច្បាប់ការងារកម្ពុជា និងរបៀបដែលវាប៉ះពាល់ដល់រោងចក្រកាត់ដេរ។'
            },
            content: {
                en: 'Full article content in English...',
                kh: 'មាតិកាអត្ថបទពេញលេញជាភាសាខ្មែរ...'
            },
            author: 'Legal Team',
            publishedAt: '2024-01-15T10:00:00Z',
            tags: ['labor-law', 'compliance', 'regulations'],
            image: '/blog/labor-law-2024.jpg'
        },
        {
            id: 2,
            title: {
                en: 'Best Practices for CAP Management',
                kh: 'ការអនុវត្តល្អបំផុតសម្រាប់ការគ្រប់គ្រងផែនការកែតម្រូវ'
            },
            excerpt: {
                en: 'Discover effective strategies for managing corrective action plans in your factory.',
                kh: 'ស្វែងរកយុទ្ធសាស្ត្រប្រកបដោយប្រសិទ្ធភាពសម្រាប់ការគ្រប់គ្រងផែនការកែតម្រូវនៅក្នុងរោងចក្ររបស់អ្នក។'
            },
            content: {
                en: 'Full article content in English...',
                kh: 'មាតិកាអត្ថបទពេញលេញជាភាសាខ្មែរ...'
            },
            author: 'Compliance Team',
            publishedAt: '2024-02-20T14:30:00Z',
            tags: ['cap', 'management', 'best-practices'],
            image: '/blog/cap-management.jpg'
        }
    ];
    
    res.json(blogPosts);
});

// Get FAQ
router.get('/faq', (req, res) => {
    const faq = [
        {
            id: 1,
            question: {
                en: 'What types of permits does Angkor Compliance track?',
                kh: 'តើ Angkor Compliance តាមដានលិខិតអនុញ្ញាតប្រភេទណាខ្លះ?'
            },
            answer: {
                en: 'We track all types of factory permits including business licenses, environmental permits, fire safety certificates, and labor compliance documents.',
                kh: 'យើងតាមដានលិខិតអនុញ្ញាតរោងចក្រគ្រប់ប្រភេទ រួមទាំងអាជ្ញាបណ្ណអាជីវកម្ម លិខិតអនុញ្ញាតបរិស្ថាន សម្បុត្រសុវត្ថិភាពពីភ្លើង និងឯកសារអនុលោមតាមច្បាប់ការងារ។'
            },
            category: 'permits'
        },
        {
            id: 2,
            question: {
                en: 'Is the system available in both Khmer and English?',
                kh: 'តើប្រព័ន្ធនេះមានជាភាសាខ្មែរ និងអង់គ្លេសទាំងពីរដែរឬទេ?'
            },
            answer: {
                en: 'Yes, our system is fully bilingual with complete support for both Khmer and English languages.',
                kh: 'បាទ ប្រព័ន្ធរបស់យើងមានភាសាទ្វេពេញលេញ ជាមួយនឹងការគាំទ្រពេញលេញសម្រាប់ភាសាខ្មែរ និងអង់គ្លេសទាំងពីរ។'
            },
            category: 'language'
        },
        {
            id: 3,
            question: {
                en: 'How secure is my factory data?',
                kh: 'តើទិន្នន័យរោងចក្ររបស់ខ្ញុំមានសុវត្ថិភាពបែបណា?'
            },
            answer: {
                en: 'We use enterprise-grade security with encrypted data transmission, secure cloud storage, and regular security audits.',
                kh: 'យើងប្រើសុវត្ថិភាពកម្រិតសហគ្រាសជាមួយនឹងការបញ្ជូនទិន្នន័យដែលបានអ៊ិនគ្រីប ការផ្ទុកពពកសុវត្ថិភាព និងការត្រួតពិនិត្យសុវត្ថិភាពទៀងទាត់។'
            },
            category: 'security'
        }
    ];
    
    res.json(faq);
});

// Submit support ticket
router.post('/support', async (req, res) => {
    try {
        const { name, email, subject, message, priority, category, language } = req.body;
        
        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: language === 'kh' 
                    ? 'សូមបំពេញព័ត៌មានទាំងអស់' 
                    : 'Please fill in all required fields'
            });
        }
        
        const ticketId = 'TICKET_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        logger.info('Support ticket created', {
            ticketId,
            name,
            email,
            subject,
            priority,
            category,
            language,
            ip: req.ip
        });
        
        // In production, save to database and send notification
        
        res.json({
            success: true,
            ticketId,
            message: language === 'kh' 
                ? 'បានបង្កើតសំបុត្រជំនួយជោគជ័យ' 
                : 'Support ticket created successfully'
        });
    } catch (error) {
        logger.error('Support ticket error:', error);
        res.status(500).json({
            error: language === 'kh' 
                ? 'មានបញ្ហាបច្ចេកទេស' 
                : 'Technical error occurred'
        });
    }
});

// Get system status
router.get('/status', (req, res) => {
    res.json({
        status: 'operational',
        services: {
            web: 'operational',
            api: 'operational',
            database: 'operational',
            email: 'operational'
        },
        lastUpdated: new Date().toISOString()
    });
});

// Dashboard API endpoints
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'UXXZIp4AZ/oP08ms2DWlv8/nQ9FtqrJBhOyzMtL7BHEZkSMlm6gv/J+e4G/OXmhUcX4MhWU9fYG1OE6XjPrP1A==';

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

// Dashboard overview data
router.get('/dashboard/overview', authenticateToken, (req, res) => {
    try {
        // In production, this would fetch real data from database
        const dashboardData = {
            stats: {
                activePermits: 12,
                totalPermits: 15,
                openCaps: 3,
                totalCaps: 8,
                upcomingDeadlines: 5,
                totalDocuments: 247,
                totalReminders: 5
            },
            trends: {
                permits: { change: '+2', trend: 'positive' },
                caps: { change: '0', trend: 'neutral' },
                documents: { change: '+15', trend: 'positive' },
                reminders: { change: '+2', trend: 'warning' }
            },
            lastUpdated: new Date().toISOString()
        };

        logger.info('Dashboard overview requested', { 
            user_id: req.user.id,
            email: req.user.email 
        });

        res.json(dashboardData);
    } catch (error) {
        logger.error('Dashboard overview error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Dashboard notifications
router.get('/dashboard/notifications', authenticateToken, (req, res) => {
    try {
        // In production, this would fetch real notifications from database
        const notifications = [
            {
                id: 1,
                type: 'warning',
                title: 'Permit Expiring Soon',
                message: 'Fire Safety Certificate expires in 7 days',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                read: false,
                action_url: '/permits/fire-safety'
            },
            {
                id: 2,
                type: 'reminder',
                title: 'CAP Due Tomorrow',
                message: 'Worker Safety Training CAP is due tomorrow',
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                read: false,
                action_url: '/caps/worker-safety'
            },
            {
                id: 3,
                type: 'success',
                title: 'Document Uploaded',
                message: 'Monthly compliance report uploaded successfully',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                read: true,
                action_url: '/documents/monthly-report'
            },
            {
                id: 4,
                type: 'info',
                title: 'New Regulation Update',
                message: 'Updated labor law guidelines are now available',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                read: false,
                action_url: '/regulations/labor-law'
            }
        ];

        logger.info('Dashboard notifications requested', { 
            user_id: req.user.id,
            count: notifications.length 
        });

        res.json(notifications);
    } catch (error) {
        logger.error('Dashboard notifications error:', error);
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});

// Mark notification as read
router.post('/dashboard/notifications/:id/read', authenticateToken, (req, res) => {
    try {
        const notificationId = req.params.id;
        
        // In production, this would update the notification in database
        logger.info('Notification marked as read', { 
            user_id: req.user.id,
            notification_id: notificationId 
        });

        res.json({ success: true });
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Dashboard recent activity
router.get('/dashboard/activity', authenticateToken, (req, res) => {
    try {
        // In production, this would fetch real activity from database
        const activities = [
            {
                id: 1,
                type: 'document_upload',
                title: 'Document Uploaded',
                description: 'Monthly compliance report uploaded',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                user: req.user.full_name || req.user.email
            },
            {
                id: 2,
                type: 'cap_created',
                title: 'CAP Created',
                description: 'New corrective action plan for workplace safety',
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                user: req.user.full_name || req.user.email
            },
            {
                id: 3,
                type: 'permit_renewed',
                title: 'Permit Renewed',
                description: 'Environmental permit renewed for 1 year',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                user: req.user.full_name || req.user.email
            },
            {
                id: 4,
                type: 'reminder_set',
                title: 'Reminder Set',
                description: 'Set reminder for fire safety inspection',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                user: req.user.full_name || req.user.email
            },
            {
                id: 5,
                type: 'login',
                title: 'User Login',
                description: 'Logged in to dashboard',
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
                user: req.user.full_name || req.user.email
            }
        ];

        logger.info('Dashboard activity requested', { 
            user_id: req.user.id,
            count: activities.length 
        });

        res.json(activities);
    } catch (error) {
        logger.error('Dashboard activity error:', error);
        res.status(500).json({ error: 'Failed to load activity' });
    }
});

// Dashboard analytics endpoint
router.post('/analytics', (req, res) => {
    try {
        const analyticsData = req.body;
        
        // In production, this would save to analytics database
        logger.info('Analytics event tracked', {
            event: analyticsData.event,
            data: analyticsData.data,
            user_id: analyticsData.user_id,
            session_id: analyticsData.session_id,
            timestamp: analyticsData.timestamp
        });

        res.json({ success: true });
    } catch (error) {
        logger.error('Analytics tracking error:', error);
        res.status(500).json({ error: 'Failed to track analytics' });
    }
});

module.exports = router; 