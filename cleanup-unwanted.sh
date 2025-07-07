#!/bin/bash

# SMS Project Cleanup Script
# This script removes unwanted/duplicate files identified during organization

echo "🧹 SMS Project Cleanup Script"
echo "============================"
echo "This script will DELETE the following:"
echo "1. SMS-Onboarding/ (old version)"
echo "2. Manus Build/ chat logs"
echo "3. Marketing-Materials/ (if duplicate)"
echo ""
echo "⚠️  WARNING: This will permanently delete files!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Create a backup first (just in case)
echo "📦 Creating safety backup first..."
backup_dir="SMS-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "../$backup_dir"
cp -r SMS-Onboarding "../$backup_dir/" 2>/dev/null
cp -r "Manus Build" "../$backup_dir/" 2>/dev/null
cp -r Marketing-Materials "../$backup_dir/" 2>/dev/null
echo "✅ Backup created at ../$backup_dir"

# Remove old onboarding version
echo ""
echo "🗑️  Removing old SMS-Onboarding directory..."
if [ -d "SMS-Onboarding" ]; then
    rm -rf SMS-Onboarding
    echo "✅ SMS-Onboarding removed"
else
    echo "⚠️  SMS-Onboarding not found"
fi

# Remove Manus Build chat logs
echo ""
echo "🗑️  Removing Manus Build chat logs..."
if [ -d "Manus Build" ]; then
    rm -rf "Manus Build"
    echo "✅ Manus Build removed"
else
    echo "⚠️  Manus Build not found"
fi

# Check if Marketing-Materials is duplicate before removing
echo ""
echo "🔍 Checking Marketing-Materials for duplicates..."
if [ -d "Marketing-Materials" ]; then
    echo "Found the following files in Marketing-Materials:"
    ls -la Marketing-Materials/
    echo ""
    echo "Do you want to remove Marketing-Materials? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf Marketing-Materials
        echo "✅ Marketing-Materials removed"
    else
        echo "⏭️  Skipping Marketing-Materials"
    fi
else
    echo "⚠️  Marketing-Materials not found"
fi

# Clean up any .DS_Store files (if on Mac)
echo ""
echo "🧹 Cleaning up .DS_Store files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null
echo "✅ Cleaned up system files"

# Show final status
echo ""
echo "📊 Cleanup Complete!"
echo "==================="
echo "✅ Removed: SMS-Onboarding (old version)"
echo "✅ Removed: Manus Build (chat logs)"
echo "❓ Marketing-Materials: Based on your choice"
echo ""
echo "💡 Your backup is saved at: ../$backup_dir"
echo "   (You can delete this after verifying everything works)"
echo ""
echo "🎯 Your project is now cleaner and more organized!"