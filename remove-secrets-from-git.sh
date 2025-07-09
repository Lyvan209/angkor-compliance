#!/bin/bash

# 🚨 CRITICAL SECURITY FIX: Remove exposed secrets from git history
# This script will remove all exposed Supabase keys and JWT secrets from git history

echo "🚨 CRITICAL: Removing exposed secrets from git history..."
echo "⚠️  WARNING: This will rewrite git history. Make sure you have a backup!"

# List of files that may contain secrets
SECRET_FILES=(
    "DEPLOYMENT-FIX.md"
    "DEPLOY-NOW.md"
    "DEPLOY_STATUS.md"
    "NETLIFY_DEPLOYMENT_GUIDE.md"
    "QA-AUDIT-DEPLOYMENT.md"
    "SUPABASE-SECURITY-AUDIT.md"
    "AUDIT-SUMMARY.md"
    "URGENT-SECURITY-SUMMARY.md"
    "README.md"
    "QUICK_START.md"
    "AUTHENTICATION_SETUP_GUIDE.md"
    "CORRECTIVE-ACTION-PLAN.md"
    "CORRECTIVE-ACTIONS-COMPLETE.md"
    "DEPLOY-FIX.md"
    "DEPLOYMENT.md"
    "env.production"
)

echo "📋 Files to clean:"
for file in "${SECRET_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done

echo ""
echo "🔧 Step 1: Remove files from git history..."
for file in "${SECRET_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing $file from git history..."
        git filter-branch --force --index-filter \
            "git rm --cached --ignore-unmatch '$file'" \
            --prune-empty --tag-name-filter cat -- --all
    fi
done

echo ""
echo "🔧 Step 2: Force push to remove from remote..."
echo "⚠️  This will overwrite remote history!"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin --force --all
    git push origin --force --tags
    echo "✅ Remote history cleaned!"
else
    echo "❌ Aborted. Remote history not cleaned."
fi

echo ""
echo "🔧 Step 3: Clean up local git references..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "🔐 NEXT STEPS:"
echo "1. Generate new Supabase API keys in Supabase dashboard"
echo "2. Update environment variables in deployment platform"
echo "3. Never commit secrets to git again"
echo "4. Use .env files and environment variables only"
echo ""
echo "⚠️  IMPORTANT: All team members must re-clone the repository!"