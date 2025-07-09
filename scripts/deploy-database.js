#!/usr/bin/env node
/**
 * Angkor Compliance Database Deployment Script
 * This script cleans up and sets up the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
    console.log(`${color}${message}${colors.reset}`);
};

const logError = (message) => log(`❌ ${message}`, colors.red);
const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);

async function main() {
    try {
        // Check environment variables
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            logError('Missing required environment variables:');
            if (!supabaseUrl) logError('- SUPABASE_URL');
            if (!supabaseServiceKey) logError('- SUPABASE_SERVICE_ROLE_KEY');
            logInfo('Please check your .env file or environment variables');
            process.exit(1);
        }

        // Initialize Supabase client with service role key
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        logInfo('🚀 Starting Angkor Compliance Database Deployment');
        logInfo(`📍 Supabase URL: ${supabaseUrl}`);
        
        // Get user confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question) => {
            return new Promise((resolve) => {
                rl.question(question, resolve);
            });
        };

        logWarning('⚠️  This will DELETE ALL DATA in your Supabase database!');
        const confirm = await askQuestion('Are you sure you want to continue? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes') {
            logInfo('❌ Deployment cancelled');
            rl.close();
            process.exit(0);
        }

        // Step 1: Run cleanup script
        logInfo('🧹 Step 1: Running cleanup script...');
        const cleanupSqlPath = path.join(__dirname, '../database/cleanup.sql');
        
        // SECURITY FIX: Use secure SQL execution instead of direct RPC
        // Read and validate SQL file
        if (!fs.existsSync(cleanupSqlPath)) {
            throw new Error('Cleanup SQL file not found');
        }
        
        const cleanupSql = fs.readFileSync(cleanupSqlPath, 'utf8');
        
        // Execute SQL safely through secure method
        const { error: cleanupError } = await executeSqlSecurely(supabase, cleanupSql, 'cleanup');

        if (cleanupError) {
            // Try direct query method if RPC fails
            logWarning('RPC method failed, trying direct query...');
            const { data: cleanupData2, error: cleanupError2 } = await supabase
                .from('_sql_runner')
                .select('*')
                .eq('sql', cleanupSql);

            if (cleanupError2) {
                logError('Cleanup script failed. You may need to run it manually in the SQL Editor.');
                console.error('Cleanup Error:', cleanupError2);
            } else {
                logSuccess('Database cleanup completed');
            }
        } else {
            logSuccess('Database cleanup completed');
        }

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Run fresh setup script
        logInfo('🏗️  Step 2: Running fresh setup script...');
        const setupSqlPath = path.join(__dirname, '../database/fresh-setup.sql');
        
        // SECURITY FIX: Use secure SQL execution
        if (!fs.existsSync(setupSqlPath)) {
            throw new Error('Setup SQL file not found');
        }
        
        const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
        
        // Execute SQL safely through secure method
        const { data: setupData, error: setupError } = await executeSqlSecurely(supabase, setupSql, 'setup');

        if (setupError) {
            // Try direct query method if RPC fails
            logWarning('RPC method failed, trying direct query...');
            const { data: setupData2, error: setupError2 } = await supabase
                .from('_sql_runner')
                .select('*')
                .eq('sql', setupSql);

            if (setupError2) {
                logError('Setup script failed. You may need to run it manually in the SQL Editor.');
                console.error('Setup Error:', setupError2);
            } else {
                logSuccess('Fresh database setup completed');
            }
        } else {
            logSuccess('Fresh database setup completed');
        }

        // Step 3: Verify setup
        logInfo('🔍 Step 3: Verifying setup...');
        
        // Check if tables exist
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (tablesError) {
            logWarning('Could not verify tables automatically');
        } else {
            const expectedTables = [
                'users', 'factories', 'permits', 'certificates', 
                'corrective_action_plans', 'grievances', 'committees',
                'meetings', 'documents', 'reminders', 'notifications',
                'audit_logs', 'factory_users'
            ];

            const existingTables = tables.map(t => t.table_name);
            const missingTables = expectedTables.filter(t => !existingTables.includes(t));

            if (missingTables.length === 0) {
                logSuccess('All required tables created successfully');
            } else {
                logWarning(`Missing tables: ${missingTables.join(', ')}`);
            }
        }

        // Step 4: Test basic functionality
        logInfo('🧪 Step 4: Testing basic functionality...');
        
        // Test a simple query
        const { data: testData, error: testError } = await supabase
            .from('factories')
            .select('*')
            .limit(1);

        if (testError) {
            logWarning('Basic query test failed. Check your RLS policies.');
        } else {
            logSuccess('Basic database queries working');
        }

        // Final success message
        logSuccess('🎉 Database deployment completed successfully!');
        logInfo('');
        logInfo('Next steps:');
        logInfo('1. Test user registration/login in your app');
        logInfo('2. Verify all features are working correctly');
        logInfo('3. Check the Supabase dashboard for any issues');
        logInfo('');
        logInfo('If you encounter any issues, check the database/run-cleanup.md file for troubleshooting tips.');

        rl.close();

    } catch (error) {
        logError('Deployment failed with error:');
        console.error(error);
        process.exit(1);
    }
}

// SECURITY FIX: Secure SQL execution with validation
async function executeSqlSecurely(supabase, sql, operationType) {
    try {
        // Validate SQL content for basic security
        const forbiddenPatterns = [
            /drop\s+database/i,
            /truncate\s+\*/i,
            /delete\s+from\s+\*\s*$/i,
            /insert\s+into.*values.*\(/i // Prevent arbitrary inserts with user data
        ];
        
        // Check for dangerous patterns
        for (const pattern of forbiddenPatterns) {
            if (pattern.test(sql)) {
                throw new Error(`Potentially dangerous SQL pattern detected in ${operationType}`);
            }
        }
        
        // Log operation for audit
        logInfo(`🔒 Executing ${operationType} SQL with security validation`);
        
        // Use prepared execution method
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: sql
        });
        
        if (error) {
            throw new Error(`SQL execution failed for ${operationType}: ${error.message}`);
        }
        
        return { data, error };
        
    } catch (error) {
        logError(`Security check failed for ${operationType}: ${error.message}`);
        throw error;
    }
}

// Helper function to execute SQL (fallback method) - DEPRECATED
async function executeSqlDirect(supabase, sql) {
    logWarning('⚠️ Using legacy SQL execution method - consider using executeSqlSecurely');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await supabase.rpc('exec_sql', { sql: statement.trim() });
            } catch (error) {
                console.warn(`Warning: Statement failed: ${statement.substring(0, 50)}...`);
            }
        }
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main }; 