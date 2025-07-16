# SMS Demo Quick Reference Card

## 🚀 Quick Start
```bash
./start-all.sh              # Start both portals
./setup-demo-data.js        # Create demo data
```

## 🔐 Login Credentials
All passwords: **Demo123!**
- Admin: admin@demo.com
- Manager: manager@demo.com  
- Technician: tech@demo.com

## 🌐 URLs
- Onboarding: http://localhost:5173
- Maintenance: http://localhost:3002
- Token: DEMO-TOKEN-2025

## 🚢 Demo Data
- Company: Demo Marine Services
- Vessel: MV Demo Explorer (IMO: 1234567)
- Equipment: 3 pre-configured items

## ✅ Test Integration
```bash
./test-demo-integration.js
```

## 🔄 Reset Data
```bash
./setup-demo-data.js  # Re-run to reset
```

## 📊 Verify Data
```bash
# Maintenance Portal
sqlite3 sms-app/backend/data/sms.db < verify-demo-setup.sql

# Onboarding Portal  
cd SMS-Onboarding-Unified && npx prisma studio
```

## 🌉 Portal Switching
1. Login to either portal
2. Click user menu → "Switch Portal"
3. Automatic authentication

## 💡 Pro Tips
- Use Chrome DevTools to test offline mode
- Check hidden 20% markup in parts_used table
- All equipment pre-approved for immediate use
- Integration bridge config in `demo-bridge-config.json`