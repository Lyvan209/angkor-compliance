#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Angkor Compliance - Secure Production Deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="angkor-compliance"
DEPLOYMENT_PLATFORM=${1:-"vercel"}  # Default to Vercel
ENVIRONMENT_FILE=".env.production"

echo -e "${BLUE}🚀 Starting Production Deployment for Angkor Compliance${NC}"
echo -e "${BLUE}Platform: ${DEPLOYMENT_PLATFORM}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Security Pre-Checks
print_info "Step 1: Running Security Pre-Checks..."

# Check for exposed secrets
if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir=node_modules --exclude-dir=.git; then
    print_error "CRITICAL: Exposed JWT tokens found in files!"
    print_warning "Please run: ./remove-secrets-from-git.sh"
    exit 1
fi

# Check for hardcoded API keys
if grep -r "skqxzsrajcdmkbxembrs" . --exclude-dir=node_modules --exclude-dir=.git; then
    print_error "CRITICAL: Hardcoded Supabase URL found!"
    print_warning "Please clean all hardcoded secrets before deployment"
    exit 1
fi

print_status "Security pre-checks passed"

# Step 2: Environment Validation
print_info "Step 2: Validating Environment Configuration..."

# Check if environment file exists
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    print_warning "Environment file $ENVIRONMENT_FILE not found"
    print_info "Creating template environment file..."
    cat > "$ENVIRONMENT_FILE" << EOF
# Production Environment Variables
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-256-bit-jwt-secret-here
SESSION_SECRET=your-session-secret-here
ALLOWED_ORIGINS=https://www.angkorcompliance.com,https://angkorcompliance.com
APP_URL=https://www.angkorcompliance.com
EOF
    print_warning "Please update $ENVIRONMENT_FILE with your actual values"
    exit 1
fi

# Validate required environment variables
required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" "$ENVIRONMENT_FILE" || grep -q "^${var}=$" "$ENVIRONMENT_FILE" || grep -q "^${var}=your-" "$ENVIRONMENT_FILE"; then
        print_error "Missing or placeholder value for $var in $ENVIRONMENT_FILE"
        exit 1
    fi
done

print_status "Environment configuration validated"

# Step 3: Security Testing
print_info "Step 3: Running Security Tests..."

if [ -f "security-test.js" ]; then
    print_info "Running comprehensive security tests..."
    if node security-test.js; then
        print_status "All security tests passed"
    else
        print_error "Security tests failed! Please fix issues before deployment"
        exit 1
    fi
else
    print_warning "Security test script not found, skipping security tests"
fi

# Step 4: Build Application
print_info "Step 4: Building Application..."

# Install dependencies
print_info "Installing dependencies..."
npm ci --only=production

# Build the application
print_info "Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Application built successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Step 5: Platform-Specific Deployment
print_info "Step 5: Deploying to $DEPLOYMENT_PLATFORM..."

case $DEPLOYMENT_PLATFORM in
    "vercel")
        deploy_vercel
        ;;
    "netlify")
        deploy_netlify
        ;;
    "railway")
        deploy_railway
        ;;
    "heroku")
        deploy_heroku
        ;;
    *)
        print_error "Unsupported deployment platform: $DEPLOYMENT_PLATFORM"
        print_info "Supported platforms: vercel, netlify, railway, heroku"
        exit 1
        ;;
esac

# Step 6: Post-Deployment Verification
print_info "Step 6: Post-Deployment Verification..."

# Wait for deployment to complete
sleep 10

# Run health check
print_info "Running health check..."
if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
    print_status "Health check passed"
else
    print_error "Health check failed"
    exit 1
fi

# Run security tests against production
print_info "Running security tests against production..."
if node security-test.js; then
    print_status "Production security tests passed"
else
    print_error "Production security tests failed"
    exit 1
fi

print_status "Production deployment completed successfully!"
print_info "Your application is now live and secure!"

# Deployment Functions

deploy_vercel() {
    print_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    print_info "Running Vercel deployment..."
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        print_status "Vercel deployment successful"
        DEPLOYMENT_URL=$(vercel ls | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')
        print_info "Deployment URL: $DEPLOYMENT_URL"
    else
        print_error "Vercel deployment failed"
        exit 1
    fi
}

deploy_netlify() {
    print_info "Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_info "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Deploy to Netlify
    print_info "Running Netlify deployment..."
    netlify deploy --prod --dir=dist
    
    if [ $? -eq 0 ]; then
        print_status "Netlify deployment successful"
        DEPLOYMENT_URL=$(netlify status | grep "Live" | awk '{print $2}')
        print_info "Deployment URL: $DEPLOYMENT_URL"
    else
        print_error "Netlify deployment failed"
        exit 1
    fi
}

deploy_railway() {
    print_info "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_info "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Deploy to Railway
    print_info "Running Railway deployment..."
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "Railway deployment successful"
        DEPLOYMENT_URL=$(railway status | grep "URL" | awk '{print $2}')
        print_info "Deployment URL: $DEPLOYMENT_URL"
    else
        print_error "Railway deployment failed"
        exit 1
    fi
}

deploy_heroku() {
    print_info "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not found. Please install it first."
        exit 1
    fi
    
    # Create Heroku app if it doesn't exist
    if ! heroku apps:info --app "$PROJECT_NAME" &> /dev/null; then
        print_info "Creating Heroku app..."
        heroku create "$PROJECT_NAME"
    fi
    
    # Set environment variables
    print_info "Setting environment variables..."
    while IFS= read -r line; do
        if [[ $line =~ ^[A-Z_]+=.*$ ]]; then
            heroku config:set "$line" --app "$PROJECT_NAME"
        fi
    done < "$ENVIRONMENT_FILE"
    
    # Deploy to Heroku
    print_info "Running Heroku deployment..."
    git push heroku main
    
    if [ $? -eq 0 ]; then
        print_status "Heroku deployment successful"
        DEPLOYMENT_URL="https://$PROJECT_NAME.herokuapp.com"
        print_info "Deployment URL: $DEPLOYMENT_URL"
    else
        print_error "Heroku deployment failed"
        exit 1
    fi
}

# Final summary
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT SUMMARY${NC}"
echo "=================="
echo -e "${BLUE}Platform:${NC} $DEPLOYMENT_PLATFORM"
echo -e "${BLUE}URL:${NC} $DEPLOYMENT_URL"
echo -e "${BLUE}Status:${NC} ✅ Deployed Successfully"
echo -e "${BLUE}Security:${NC} ✅ All Tests Passed"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo "1. Configure custom domain (if needed)"
echo "2. Set up monitoring and alerts"
echo "3. Configure backup procedures"
echo "4. Train users on the new system"
echo ""
echo -e "${GREEN}🚀 Your Angkor Compliance system is now live and secure!${NC}"