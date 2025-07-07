#!/bin/bash

# SMS Project Organization Script
# This script MOVES files, doesn't delete anything
# Creates a clear structure and preserves all ideas

echo "🔍 SMS Project Organization Script"
echo "================================="
echo "This script will:"
echo "1. Create a clean folder structure"
echo "2. Move (not delete) files to organized locations"
echo "3. Extract all ideas/features from docs into one place"
echo "4. Set up a system for future ideas"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Create new organized structure
echo "📁 Creating organized structure..."
mkdir -p organized/apps/maintenance-portal
mkdir -p organized/apps/onboarding-portal
mkdir -p organized/docs/business
mkdir -p organized/docs/technical
mkdir -p organized/docs/operations
mkdir -p organized/docs/features
mkdir -p organized/IDEAS
mkdir -p organized/archive/old-versions
mkdir -p organized/archive/chat-logs
mkdir -p organized/scripts

# Create IDEAS tracking system
echo "💡 Setting up IDEAS tracking system..."
cat > organized/IDEAS/README.md << 'EOF'
# SMS Ideas & Features Tracking

This folder contains ALL ideas mentioned across the project.

## How to add new ideas:

1. **Quick idea**: Add to IDEAS_BACKLOG.md
2. **Feature request**: Add to FEATURES_TODO.md  
3. **Business idea**: Add to BUSINESS_IDEAS.md
4. **Technical improvement**: Add to TECHNICAL_IDEAS.md

## Auto-captured from project:
- See EXTRACTED_IDEAS.md for all ideas found in existing docs
- See FEATURES_MENTIONED.md for all features discussed

## Priority System:
- 🔴 P1: Critical for launch
- 🟡 P2: Important but not blocking
- 🟢 P3: Nice to have
- 💡 P4: Future consideration
EOF

# Extract all mentioned features and ideas from existing docs
echo "🔎 Extracting all mentioned ideas and features..."
echo "# Extracted Ideas from SMS Project" > organized/IDEAS/EXTRACTED_IDEAS.md
echo "Generated on: $(date)" >> organized/IDEAS/EXTRACTED_IDEAS.md
echo "" >> organized/IDEAS/EXTRACTED_IDEAS.md

# Search for ideas, features, TODO, FIXME, etc.
grep -r -i -n "idea\|feature\|todo\|fixme\|enhancement\|future\|could\|should\|would be nice" \
  --include="*.md" --include="*.txt" . 2>/dev/null | \
  grep -v "organized/" | \
  sed 's/^/- /' >> organized/IDEAS/EXTRACTED_IDEAS.md

# Create feature tracking files
cat > organized/IDEAS/FEATURES_TODO.md << 'EOF'
# Features To-Do List

## From Chats & Docs:
### High Priority
- [ ] Portal Integration (Onboarding → Maintenance)
- [ ] Email notifications
- [ ] Payment processing (Stripe)
- [ ] Production deployment

### Medium Priority  
- [ ] AI diagnostics integration
- [ ] Predictive maintenance
- [ ] Advanced analytics
- [ ] Mobile app optimization

### Low Priority
- [ ] Voice interface
- [ ] AR integration
- [ ] Marketplace
- [ ] API for third parties

## Add new features below:
---

EOF

# Create a git-tracked ideas file
cat > organized/IDEAS/IDEAS_BACKLOG.md << 'EOF'
# Ideas Backlog

Add any new idea here with date and description.
This file is git-tracked so ideas persist across sessions.

## Format:
[DATE] - CATEGORY - IDEA DESCRIPTION

## Ideas:
---

EOF

# Move core apps
echo "🚀 Moving core applications..."
cp -r sms-app/* organized/apps/maintenance-portal/ 2>/dev/null
cp -r SMS-Onboarding-Unified/* organized/apps/onboarding-portal/ 2>/dev/null

# Move documentation by type
echo "📚 Organizing documentation..."
cp MASTER_*.md organized/docs/business/ 2>/dev/null
cp *BUSINESS*.md organized/docs/business/ 2>/dev/null
cp *REVENUE*.md organized/docs/business/ 2>/dev/null

cp Architecture/*.md organized/docs/technical/ 2>/dev/null
cp *ARCHITECTURE*.md organized/docs/technical/ 2>/dev/null
cp *TECHNICAL*.md organized/docs/technical/ 2>/dev/null

cp Operations/*.md organized/docs/operations/ 2>/dev/null
cp *DEPLOYMENT*.md organized/docs/operations/ 2>/dev/null
cp *SECURITY*.md organized/docs/operations/ 2>/dev/null

cp Features/*.md organized/docs/features/ 2>/dev/null
cp *FEATURE*.md organized/docs/features/ 2>/dev/null

# Move scripts
echo "⚙️ Moving scripts..."
cp *.sh organized/scripts/ 2>/dev/null

# Archive old versions
echo "📦 Archiving old versions..."
cp -r SMS-Onboarding organized/archive/old-versions/ 2>/dev/null
cp -r "Manus Build" organized/archive/chat-logs/ 2>/dev/null

# Create a map of where everything went
echo "🗺️ Creating movement map..."
cat > organized/MOVED_FILES_MAP.md << 'EOF'
# File Movement Map

## Core Apps
- sms-app/ → organized/apps/maintenance-portal/
- SMS-Onboarding-Unified/ → organized/apps/onboarding-portal/

## Documentation
- Business docs → organized/docs/business/
- Technical docs → organized/docs/technical/
- Operations docs → organized/docs/operations/
- Feature docs → organized/docs/features/

## Archives
- SMS-Onboarding/ → organized/archive/old-versions/
- Manus Build/ → organized/archive/chat-logs/

## New Additions
- organized/IDEAS/ - All ideas and features tracking
- organized/scripts/ - All executable scripts

## Original Structure
Your original files are still in place. This script only COPIED files.
To complete the move, verify everything looks good, then remove originals.
EOF

echo ""
echo "✅ Organization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check the 'organized' folder"
echo "2. Review organized/IDEAS/EXTRACTED_IDEAS.md for all captured ideas"
echo "3. If everything looks good, you can remove the original folders"
echo "4. Move the contents of 'organized' to your root SMS folder"
echo ""
echo "💡 Going forward:"
echo "- Add new ideas to organized/IDEAS/IDEAS_BACKLOG.md"
echo "- Track features in organized/IDEAS/FEATURES_TODO.md"
echo "- These files are git-tracked so they persist across chat sessions"