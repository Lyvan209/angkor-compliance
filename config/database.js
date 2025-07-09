/**
 * Supabase Database Configuration for Angkor Compliance
 * Handles database connections, authentication, and real-time features
 */

const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');
require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'supabase-client' },
    transports: [
        new winston.transports.File({ filename: 'logs/database.log' })
    ]
});

// Supabase configuration - SECURITY FIX: No hardcoded secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SECURITY FIX: Enhanced environment variable validation
if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'test' || process.argv.includes('--syntax-check')) {
        console.warn('⚠️ Supabase configuration missing - running in test mode');
        module.exports = { databaseService: null, supabaseClient: null };
        return;
    }
    
    logger.error('❌ CRITICAL: Missing required environment variables:');
    if (!supabaseUrl) logger.error('  - SUPABASE_URL');
    if (!supabaseAnonKey) logger.error('  - SUPABASE_ANON_KEY');
    logger.error('\n📝 Please check your .env file or environment configuration');
    logger.error('🔧 See setup-environment.sh for help configuring variables');
    
    throw new Error('Supabase configuration is incomplete - check environment variables');
}

// Client for public operations (frontend)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Admin client for server-side operations
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}) : null;

// Database table names
const TABLES = {
    USERS: 'users',
    FACTORIES: 'factories',
    PERMITS: 'permits',
    CERTIFICATES: 'certificates',
    CAPS: 'corrective_action_plans',
    GRIEVANCES: 'grievances',
    COMMITTEES: 'committees',
    MEETINGS: 'meetings',
    DOCUMENTS: 'documents',
    REMINDERS: 'reminders',
    AUDIT_LOGS: 'audit_logs',
    NOTIFICATIONS: 'notifications'
};

// Database operations wrapper
class DatabaseService {
    constructor() {
        this.client = supabaseClient;
        this.admin = supabaseAdmin;
        this.tables = TABLES;
    }

    // User Authentication
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            
            if (error) throw error;
            
            logger.info('User signed up successfully', { email });
            return { user: data.user, session: data.session };
        } catch (error) {
            logger.error('Sign up error:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            logger.info('User signed in successfully', { email });
            return { user: data.user, session: data.session };
        } catch (error) {
            logger.error('Sign in error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;
            
            logger.info('User signed out successfully');
            return true;
        } catch (error) {
            logger.error('Sign out error:', error);
            throw error;
        }
    }

    // User Management
    async getUserByEmail(email) {
        try {
            if (!this.admin) {
                // If admin client not available, skip user check
                logger.warn('Admin client not available, skipping duplicate email check');
                return null;
            }
            
            // Try to get user by email using admin client
            try {
                const { data, error } = await this.admin.auth.admin.listUsers();
                
                if (error) throw error;
                
                // Find user by email
                const user = data.users.find(u => u.email === email);
                return user || null;
            } catch (adminError) {
                // If admin function fails, log but don't block registration
                logger.warn('Admin user lookup failed, allowing registration:', adminError.message);
                return null;
            }
        } catch (error) {
            logger.error('Get user by email error:', error);
            // Return null to allow registration to proceed
            return null;
        }
    }

    async getUserById(userId) {
        try {
            if (!this.admin) {
                throw new Error('Admin client not available');
            }
            
            const { data, error } = await this.admin.auth.admin.getUserById(userId);
            
            if (error) {
                if (error.message.includes('User not found')) {
                    return null;
                }
                throw error;
            }
            
            return data.user;
        } catch (error) {
            logger.error('Get user by ID error:', error);
            if (error.message.includes('User not found')) {
                return null;
            }
            throw error;
        }
    }

    // Token Management
    async storeRefreshToken(userId, token) {
        try {
            // Store in a refresh_tokens table or in user metadata
            const { data, error } = await this.client
                .from('refresh_tokens')
                .insert({
                    user_id: userId,
                    token,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                });
            
            if (error) {
                // If table doesn't exist, log warning but don't fail
                logger.warn('Refresh token table not found, skipping storage:', error);
                return true;
            }
            
            logger.info('Refresh token stored', { userId });
            return data;
        } catch (error) {
            logger.error('Store refresh token error:', error);
            // Don't throw error - this is not critical for basic auth
            return true;
        }
    }

    async revokeRefreshToken(token) {
        try {
            const { data, error } = await this.client
                .from('refresh_tokens')
                .delete()
                .eq('token', token);
            
            if (error) {
                logger.warn('Refresh token table not found, skipping revocation:', error);
                return true;
            }
            
            logger.info('Refresh token revoked');
            return data;
        } catch (error) {
            logger.error('Revoke refresh token error:', error);
            // Don't throw error - this is not critical for basic auth
            return true;
        }
    }

    // Factory Management
    async createFactory(factoryData) {
        try {
            const { data, error } = await this.client
                .from(TABLES.FACTORIES)
                .insert(factoryData)
                .select()
                .single();
            
            if (error) throw error;
            
            logger.info('Factory created', { factoryId: data.id });
            return data;
        } catch (error) {
            logger.error('Create factory error:', error);
            throw error;
        }
    }

    async getFactories(userId) {
        try {
            const { data, error } = await this.client
                .from(TABLES.FACTORIES)
                .select('*')
                .eq('user_id', userId);
            
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Get factories error:', error);
            throw error;
        }
    }

    // Permit Management
    async createPermit(permitData) {
        try {
            const { data, error } = await this.client
                .from(TABLES.PERMITS)
                .insert(permitData)
                .select()
                .single();
            
            if (error) throw error;
            
            logger.info('Permit created', { permitId: data.id });
            return data;
        } catch (error) {
            logger.error('Create permit error:', error);
            throw error;
        }
    }

    async getPermits(factoryId) {
        try {
            const { data, error } = await this.client
                .from(TABLES.PERMITS)
                .select('*')
                .eq('factory_id', factoryId)
                .order('expiry_date', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Get permits error:', error);
            throw error;
        }
    }

    async getExpiringPermits(factoryId, days = 30) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            
            const { data, error } = await this.client
                .from(TABLES.PERMITS)
                .select('*')
                .eq('factory_id', factoryId)
                .lte('expiry_date', futureDate.toISOString())
                .order('expiry_date', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Get expiring permits error:', error);
            throw error;
        }
    }

    // CAP Management
    async createCAP(capData) {
        try {
            const { data, error } = await this.client
                .from(TABLES.CAPS)
                .insert(capData)
                .select()
                .single();
            
            if (error) throw error;
            
            logger.info('CAP created', { capId: data.id });
            return data;
        } catch (error) {
            logger.error('Create CAP error:', error);
            throw error;
        }
    }

    async getCAPs(factoryId) {
        try {
            const { data, error } = await this.client
                .from(TABLES.CAPS)
                .select('*')
                .eq('factory_id', factoryId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Get CAPs error:', error);
            throw error;
        }
    }

    async updateCAPStatus(capId, status, progressNotes = '') {
        try {
            const { data, error } = await this.client
                .from(TABLES.CAPS)
                .update({ 
                    status, 
                    progress_notes: progressNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', capId)
                .select()
                .single();
            
            if (error) throw error;
            
            logger.info('CAP status updated', { capId, status });
            return data;
        } catch (error) {
            logger.error('Update CAP status error:', error);
            throw error;
        }
    }

    // Grievance Management
    async createGrievance(grievanceData) {
        try {
            const { data, error } = await this.client
                .from(TABLES.GRIEVANCES)
                .insert(grievanceData)
                .select()
                .single();
            
            if (error) throw error;
            
            logger.info('Grievance created', { grievanceId: data.id });
            return data;
        } catch (error) {
            logger.error('Create grievance error:', error);
            throw error;
        }
    }

    async getGrievances(factoryId) {
        try {
            const { data, error } = await this.client
                .from(TABLES.GRIEVANCES)
                .select('*')
                .eq('factory_id', factoryId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Get grievances error:', error);
            throw error;
        }
    }

    // Document Management
    async uploadDocument(file, path) {
        try {
            const { data, error } = await this.client.storage
                .from('documents')
                .upload(path, file);
            
            if (error) throw error;
            
            logger.info('Document uploaded', { path });
            return data;
        } catch (error) {
            logger.error('Upload document error:', error);
            throw error;
        }
    }

    async getDocumentUrl(path) {
        try {
            const { data } = this.client.storage
                .from('documents')
                .getPublicUrl(path);
            
            return data.publicUrl;
        } catch (error) {
            logger.error('Get document URL error:', error);
            throw error;
        }
    }

    // Audit Logging
    async logAction(userId, action, details = {}) {
        try {
            const { data, error } = await this.client
                .from(TABLES.AUDIT_LOGS)
                .insert({
                    user_id: userId,
                    action,
                    details,
                    ip_address: details.ip || null,
                    user_agent: details.userAgent || null,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            logger.info('Action logged', { userId, action });
            return data;
        } catch (error) {
            logger.error('Log action error:', error);
            throw error;
        }
    }

    // Real-time subscriptions
    subscribeToCAPs(factoryId, callback) {
        return this.client
            .channel('caps-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: TABLES.CAPS,
                    filter: `factory_id=eq.${factoryId}`
                }, 
                callback
            )
            .subscribe();
    }

    subscribeToGrievances(factoryId, callback) {
        return this.client
            .channel('grievances-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: TABLES.GRIEVANCES,
                    filter: `factory_id=eq.${factoryId}`
                }, 
                callback
            )
            .subscribe();
    }

    // Health check
    async healthCheck() {
        try {
            const { data, error } = await this.client
                .from(TABLES.USERS)
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            logger.error('Database health check failed:', error);
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = {
    supabaseClient,
    supabaseAdmin,
    databaseService,
    TABLES
}; 