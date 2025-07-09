#!/usr/bin/env node

/**
 * Angkor Compliance Production Deployment Script
 * Automates the deployment process with proper checks and validations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log('\n' + '='.repeat(50), 'cyan');
    log(message, 'bright');
    log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if command exists
function commandExists(command) {
    try {
        execSync(`command -v ${command}`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

// Run command with error handling
function runCommand(command, description) {
    try {
        logInfo(`Running: ${description}`);
        const result = execSync(command, { stdio: 'pipe' });
        logSuccess(`Completed: ${description}`);
        return result.toString();
    } catch (error) {
        logError(`Failed: ${description}`);
        logError(`Error: ${error.message}`);
        throw error;
    }
}

// Validate environment variables
function validateEnvironment() {
    logHeader('🔍 VALIDATING ENVIRONMENT');
    
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
        'SESSION_SECRET'
    ];
    
    const envFile = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envFile)) {
        logError('Environment file (.env) not found!');
        logInfo('Create .env file with required variables');
        return false;
    }
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    const missingVars = [];
    
    requiredVars.forEach(varName => {
        if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=YOUR_`)) {
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        logError('Missing or invalid environment variables:');
        missingVars.forEach(varName => {
            logError(`  - ${varName}`);
        });
        logInfo('Please update .env file with valid credentials');
        return false;
    }
    
    logSuccess('Environment validation passed');
    return true;
}

// Test local server
function testLocalServer() {
    logHeader('🧪 TESTING LOCAL SERVER');
    
    try {
        // Start server in background
        logInfo('Starting local server...');
        const serverProcess = execSync('npm start &', { stdio: 'ignore' });
        
        // Wait for server to start
        setTimeout(() => {
            try {
                // Test health endpoint
                const healthCheck = execSync('curl -s http://localhost:3000/api/health', { stdio: 'pipe' });
                logSuccess('Health check passed');
                
                // Test login endpoint
                const loginTest = execSync(`curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpass123"}'`, { stdio: 'pipe' });
                logSuccess('Login endpoint responsive');
                
                // Kill server
                execSync('pkill -f "node server.js"', { stdio: 'ignore' });
                
                return true;
            } catch (error) {
                logError('Local server tests failed');
                logError(error.message);
                return false;
            }
        }, 5000);
        
    } catch (error) {
        logError('Failed to start local server');
        return false;
    }
}

// Deploy to Vercel
function deployToVercel() {
    logHeader('🚀 DEPLOYING TO VERCEL');
    
    if (!commandExists('vercel')) {
        logInfo('Installing Vercel CLI...');
        runCommand('npm install -g vercel', 'Installing Vercel CLI');
    }
    
    // Login to Vercel
    logInfo('Please login to Vercel when prompted...');
    runCommand('vercel login', 'Vercel login');
    
    // Deploy to production
    runCommand('vercel --prod', 'Deploying to production');
    
    logSuccess('Deployment to Vercel completed');
}

// Deploy to Netlify
function deployToNetlify() {
    logHeader('🚀 DEPLOYING TO NETLIFY');
    
    if (!commandExists('netlify')) {
        logInfo('Installing Netlify CLI...');
        runCommand('npm install -g netlify-cli', 'Installing Netlify CLI');
    }
    
    // Login to Netlify
    logInfo('Please login to Netlify when prompted...');
    runCommand('netlify login', 'Netlify login');
    
    // Deploy to production
    runCommand('netlify deploy --prod', 'Deploying to production');
    
    logSuccess('Deployment to Netlify completed');
}

// Main deployment function
function deploy() {
    try {
        logHeader('🎯 ANGKOR COMPLIANCE DEPLOYMENT');
        
        // Step 1: Validate environment
        if (!validateEnvironment()) {
            logError('Environment validation failed. Please fix issues and try again.');
            process.exit(1);
        }
        
        // Step 2: Install dependencies
        logHeader('📦 INSTALLING DEPENDENCIES');
        runCommand('npm install', 'Installing dependencies');
        
        // Step 3: Build project (skip for Node.js server applications)
        logHeader('🔨 PREPARING FOR DEPLOYMENT');
        logInfo('Skipping build step - Node.js server application');
        
        // Step 4: Choose deployment platform
        logHeader('🚀 DEPLOYMENT PLATFORM');
        const platform = process.argv[2] || 'vercel';
        
        if (platform === 'vercel') {
            deployToVercel();
        } else if (platform === 'netlify') {
            deployToNetlify();
        } else {
            logError('Invalid deployment platform. Use: vercel or netlify');
            process.exit(1);
        }
        
        // Step 5: Post-deployment verification
        logHeader('✅ POST-DEPLOYMENT VERIFICATION');
        logInfo('Please verify the following:');
        logInfo('1. Login functionality works');
        logInfo('2. Registration works');
        logInfo('3. Dashboard is accessible');
        logInfo('4. API endpoints are responding');
        logInfo('5. SSL certificate is active');
        
        logSuccess('Deployment completed successfully!');
        
    } catch (error) {
        logError('Deployment failed!');
        logError(error.message);
        process.exit(1);
    }
}

// Environment setup helper
function setupEnvironment() {
    logHeader('🔧 ENVIRONMENT SETUP');
    
    const envTemplate = `# Angkor Compliance Environment Variables
# Update these values with your actual credentials

# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# Security Keys (Generate new 256-bit keys)
SESSION_SECRET=your-256-bit-session-secret-here
JWT_SECRET=your-256-bit-jwt-secret-here

# Supabase Configuration
SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY_HERE

# Feature Flags
ENABLE_SUPABASE=true
ENABLE_ANALYTICS=true
ENABLE_REALTIME=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com

# Logging
LOG_LEVEL=info
DEBUG=false
`;
    
    fs.writeFileSync('.env.template', envTemplate);
    logSuccess('Environment template created (.env.template)');
    logInfo('Copy .env.template to .env and update with your credentials');
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
    case 'setup':
        setupEnvironment();
        break;
    case 'deploy':
        deploy();
        break;
    case 'vercel':
        process.argv[2] = 'vercel';
        deploy();
        break;
    case 'netlify':
        process.argv[2] = 'netlify';
        deploy();
        break;
    default:
        logHeader('🎯 ANGKOR COMPLIANCE DEPLOYMENT TOOL');
        logInfo('Usage:');
        logInfo('  node deploy.js setup     - Set up environment template');
        logInfo('  node deploy.js deploy    - Deploy to default platform (Vercel)');
        logInfo('  node deploy.js vercel    - Deploy to Vercel');
        logInfo('  node deploy.js netlify   - Deploy to Netlify');
        break;
} 