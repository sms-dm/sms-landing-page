#!/bin/bash

# Script to update all FLOATING references to TEMPORARY

echo "🔄 Updating FLOATING to TEMPORARY in all files..."

# Update in Onboarding portal
echo "📁 Updating Onboarding portal files..."
find /home/sms/repos/SMS/SMS-Onboarding-Unified -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -exec grep -l "FLOATING" {} \; | while read file; do
    echo "  Updating: $file"
    sed -i 's/FLOATING/TEMPORARY/g' "$file"
    sed -i 's/Floating/Temporary/g' "$file"
    sed -i 's/floating/temporary/g' "$file"
done

# Update in Maintenance portal
echo "📁 Updating Maintenance portal files..."
find /home/sms/repos/SMS/sms-app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -exec grep -l "FLOATING" {} \; | while read file; do
    echo "  Updating: $file"
    sed -i 's/FLOATING/TEMPORARY/g' "$file"
    sed -i 's/Floating/Temporary/g' "$file"
    sed -i 's/floating/temporary/g' "$file"
done

echo "✅ Update complete!"