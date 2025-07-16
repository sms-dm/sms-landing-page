#!/bin/bash

echo "🚀 Integrating Onboarding Demo into Landing Page..."

# Build the onboarding portal
echo "📦 Building Onboarding Portal..."
cd ../ONBOARDING-PORTAL
npm run build

# Copy the built files to landing page public directory
echo "📋 Copying demo files..."
mkdir -p ../LANDING-PAGE/public/demo
cp -r dist/* ../LANDING-PAGE/public/demo/

# Go back to landing page
cd ../LANDING-PAGE

echo "✅ Demo integrated! The onboarding demo will be available at /demo"
echo "🎯 Next steps:"
echo "   1. Test locally with: npm run dev"
echo "   2. Commit and push to GitHub"
echo "   3. Railway will auto-deploy"