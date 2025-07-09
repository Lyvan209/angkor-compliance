#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if authentication is properly configured
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Angkor Compliance Setup Verification\n');
console.log('='.repeat(50));

// Load environment variables
dotenv.config({ path: '.env.local' });

let checksPass = true;

// Check 1: Environment file exists
console.log('\n✓ Checking environment configuration...');
const envFiles = ['.env.local', '.env'];
let envFileFound = false;

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Found environment file: ${file}`);
    envFileFound = true;
    break;
  }
}

if (!envFileFound) {
  console.log('❌ No environment file found!');
  console.log('   → Create .env.local with your Supabase credentials');
  checksPass = false;
}

// Check 2: Required environment variables
console.log('\n✓ Checking required environment variables...');
const requiredVars = {
  'VITE_SUPABASE_URL': {
    pattern: /^https:\/\/[a-zA-Z0-9]+\.supabase\.co$/,
    example: 'https://your-project-id.supabase.co'
  },
  'VITE_SUPABASE_ANON_KEY': {
    pattern: /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};

for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName} is not set`);
    console.log(`   → Add to .env.local: ${varName}=${config.example}`);
    checksPass = false;
  } else if (value.includes('your-') || value === config.example) {
    console.log(`⚠️  ${varName} contains placeholder value`);
    console.log(`   → Replace with actual value from Supabase dashboard`);
    checksPass = false;
  } else if (!config.pattern.test(value)) {
    console.log(`⚠️  ${varName} format looks incorrect`);
    console.log(`   → Expected format: ${config.example}`);
    console.log(`   → Current value: ${value.substring(0, 30)}...`);
    checksPass = false;
  } else {
    console.log(`✅ ${varName} is properly configured`);
  }
}

// Check 3: Node.js version
console.log('\n✓ Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.log(`❌ Node.js ${nodeVersion} is too old (minimum v14 required)`);
  checksPass = false;
} else {
  console.log(`✅ Node.js ${nodeVersion} is compatible`);
}

// Check 4: Dependencies installed
console.log('\n✓ Checking dependencies...');
if (fs.existsSync('node_modules')) {
  const requiredPackages = ['@supabase/supabase-js', 'react', 'vite'];
  let allPackagesFound = true;
  
  for (const pkg of requiredPackages) {
    const pkgPath = path.join('node_modules', pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`✅ ${pkg} is installed`);
    } else {
      console.log(`❌ ${pkg} is not installed`);
      allPackagesFound = false;
    }
  }
  
  if (!allPackagesFound) {
    console.log('   → Run: npm install');
    checksPass = false;
  }
} else {
  console.log('❌ Dependencies not installed');
  console.log('   → Run: npm install');
  checksPass = false;
}

// Check 5: API modules exist
console.log('\n✓ Checking API modules...');
const apiPaths = [
  'src/lib/supabase.js',
  'src/lib/supabase-enhanced.js'
];

let apiModuleFound = false;
for (const apiPath of apiPaths) {
  if (fs.existsSync(apiPath)) {
    console.log(`✅ Found API module: ${apiPath}`);
    apiModuleFound = true;
  }
}

if (!apiModuleFound) {
  console.log('❌ No API modules found');
  console.log('   → API files should be in src/lib/');
  checksPass = false;
}

// Print summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

if (checksPass) {
  console.log('\n✅ All checks passed! Your setup looks good.');
  console.log('\n🚀 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:5173');
  console.log('3. Try to register/login');
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
  console.log('\n📚 Setup Guide: See AUTHENTICATION_SETUP_GUIDE.md');
}

console.log('\n💡 Quick Commands:');
console.log('- Start dev server: npm run dev');
console.log('- Test authentication: node test-real-auth.mjs');
console.log('- Run this check again: node verify-setup.mjs');

process.exit(checksPass ? 0 : 1);