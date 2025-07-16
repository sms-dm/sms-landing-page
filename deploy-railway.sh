#!/bin/bash

# SMS Production Deployment Script for Railway
# This script prepares and deploys the SMS system to Railway

set -e

echo "🚀 Starting SMS Production Deployment to Railway"
echo "============================================"

# Check if we're on master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "❌ Error: You must be on the master branch to deploy to production"
    echo "Current branch: $CURRENT_BRANCH"
    echo "Run: git checkout master"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Verify Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
fi

echo "✅ Pre-deployment checks passed"

# Build check for all services
echo ""
echo "🔨 Running build checks..."

# Check Landing Page
echo "Checking landing page..."
cd sms-landing
npm install
npm run build
cd ..

# Check Onboarding Portal
echo "Checking onboarding portal..."
cd SMS-Onboarding-Unified
npm install
npm run build
cd backend
npm install
cd ../..

# Check Maintenance Portal  
echo "Checking maintenance portal..."
cd sms-app/frontend
npm install
npm run build
cd ../backend
npm install
cd ../..

echo "✅ All builds successful"

# Create production branch if it doesn't exist
git checkout -b production 2>/dev/null || git checkout production
git merge master --no-edit

echo ""
echo "📦 Ready to deploy to Railway!"
echo ""
echo "Next steps:"
echo "1. Run: railway login"
echo "2. Run: railway link (to link to your project)"
echo "3. Run: railway up"
echo ""
echo "Make sure to set up these environment variables in Railway:"
echo "- DATABASE_URL (PostgreSQL)"
echo "- JWT_SECRET"
echo "- SMTP credentials"
echo "- Your domain settings"
echo ""
echo "After deployment, update your DNS records to point to Railway's domains"