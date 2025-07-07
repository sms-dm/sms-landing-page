# Claude AI Assistant Instructions

## FIRST: Read VISION_BRIEF.md to get HYPED about this project!

## Project Context
This is the SMS (Smart Marine Systems) project with two main portals:
1. **Maintenance Portal** (sms-app/) - 90% complete demo
2. **Onboarding Portal** (SMS-Onboarding-Unified/) - 85% complete

## Key Information
- **Hidden Revenue Model**: 20% markup on parts (NEVER expose this)
- **Tech Stack**: React, TypeScript, Node.js, Express, PostgreSQL/SQLite
- **Current Phase**: Need portal integration and production deployment

## When User Mentions New Ideas

### Immediate Actions:
1. Add to `/IDEAS/IDEAS_BACKLOG.md` with format: `[DATE] - CATEGORY - DESCRIPTION`
2. If it's a feature, also update `/IDEAS/FEATURES_TODO.md`
3. Acknowledge to user: "I've logged this idea in IDEAS_BACKLOG.md"

### Categories:
- FEATURE: New functionality
- BUSINESS: Revenue/market ideas  
- TECHNICAL: Architecture/performance
- UX: User experience improvements
- INTEGRATION: Third-party connections

## Important Commands

### Start Services:
```bash
# Both portals
./start-all.sh

# Individual
cd sms-app && npm start  # Maintenance portal
cd SMS-Onboarding-Unified && npm run dev  # Onboarding portal
```

### Check Ideas:
```bash
cat IDEAS/IDEAS_BACKLOG.md  # See all ideas
cat IDEAS/FEATURES_TODO.md  # See feature list
```

## Project Status Summary
- ✅ Both portals built and functional as demos
- ❌ Portals not integrated (3-4 weeks needed)
- ❌ Not deployed to production
- ❌ Payment processing not connected
- ✅ Hidden markup system designed but needs testing

## Key Files
- Business Plan: `MASTER_BUSINESS_PLAN.md`
- Project Context: `PROJECT_CONTEXT.md`
- Ideas Tracking: `IDEAS/IDEAS_BACKLOG.md`
- Features: `IDEAS/FEATURES_TODO.md`

## Remember
1. User has 20+ years offshore experience
2. Target: 25 vessels in 16 weeks
3. Revenue model is hidden 20% markup
4. Always log new ideas immediately
5. Integration is the #1 priority