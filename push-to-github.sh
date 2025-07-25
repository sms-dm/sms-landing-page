#!/bin/bash

# Push SMS code to GitHub
echo "📦 Preparing to push SMS code to GitHub..."

# Check if we have a remote
if git remote -v | grep -q origin; then
    echo "Remote 'origin' already exists"
else
    # Add your GitHub repository URL here
    echo "Please enter your GitHub repository URL (e.g., https://github.com/yourusername/SMS.git):"
    read GITHUB_URL
    git remote add origin $GITHUB_URL
fi

# Make sure we're on master branch
git checkout master

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin master

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Railway.app"
echo "2. Create new project → Deploy from GitHub repo"
echo "3. Select your SMS repository"
echo "4. Follow the deployment guide"