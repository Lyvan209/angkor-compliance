#!/bin/bash

# Angkor Compliance Environment Setup Script
# This script helps configure environment variables for deployment

echo "🏛️ Angkor Compliance Environment Setup"
echo "======================================"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "📋 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created from env.example"
fi

echo ""
echo "🔧 Required Environment Variables:"
echo "================================="

# List of required variables
required_vars=(
    "NODE_ENV"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
)

# Check each required variable
missing_vars=()
for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env 2>/dev/null; then
        value=$(grep "^$var=" .env | cut -d'=' -f2-)
        if [ -z "$value" ] || [ "$value" = "your-value-here" ]; then
            echo "❌ $var: NOT CONFIGURED"
            missing_vars+=("$var")
        else
            echo "✅ $var: configured"
        fi
    else
        echo "❌ $var: MISSING"
        missing_vars+=("$var")
    fi
done

echo ""

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "🎉 All required environment variables are configured!"
    
    echo ""
    echo "🚀 Netlify Deployment Commands:"
    echo "==============================="
    echo "1. Add these environment variables to your Netlify site:"
    echo ""
    
    # Show Netlify environment variables
    for var in "${required_vars[@]}"; do
        value=$(grep "^$var=" .env | cut -d'=' -f2-)
        echo "   $var=$value"
    done
    
    echo ""
    echo "2. Redeploy your site:"
    echo "   - Go to Netlify dashboard"
    echo "   - Click 'Trigger deploy' → 'Deploy site'"
    echo ""
    echo "3. Test the endpoints:"
    echo "   - https://angkorcompliance.com/.netlify/functions/debug"
    echo "   - https://angkorcompliance.com/api/auth/health"
    
else
    echo "⚠️  Missing configuration for: ${missing_vars[*]}"
    echo ""
    echo "🔧 To fix this:"
    echo "1. Edit the .env file with your actual values"
    echo "2. Run this script again to verify"
    echo ""
    echo "💡 Need help? Check DEPLOYMENT-FIX.md for detailed instructions"
fi

echo ""
echo "📊 Testing local setup..."

# Test if Node.js dependencies are installed
if [ -d "node_modules" ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Dependencies missing - run 'npm install'"
fi

# Test if Netlify CLI is available
if command -v netlify &> /dev/null; then
    echo "✅ Netlify CLI available"
else
    echo "💡 Install Netlify CLI: npm install -g netlify-cli"
fi

echo ""
echo "🔍 Quick Health Check:"
echo "====================="

# Test Node.js version
node_version=$(node --version 2>/dev/null || echo "not installed")
echo "Node.js version: $node_version"

# Test npm version  
npm_version=$(npm --version 2>/dev/null || echo "not installed")
echo "npm version: $npm_version"

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Configure missing environment variables (if any)"
echo "2. Deploy to Netlify with environment variables"
echo "3. Test the authentication endpoints"
echo "4. Monitor the deployment logs"

echo ""
echo "🆘 Need help? Check these files:"
echo "- DEPLOYMENT-FIX.md (emergency fixes)"
echo "- DEPLOYMENT.md (complete deployment guide)" 
echo "- README.md (general documentation)"

echo ""
echo "✨ Setup complete! Good luck with your deployment!" 