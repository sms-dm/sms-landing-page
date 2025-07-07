# ONBOARDING WIZARD - SEPARATE SYSTEM ARCHITECTURE

## WHY SEPARATE?

### Different Purpose
- **SMS Portal**: Daily operations, fault reporting, maintenance
- **Onboarding Wizard**: One-time setup, data collection

### Different Users  
- **SMS Portal**: Technicians, managers daily
- **Onboarding**: Admin/champion during setup only

### Different Devices
- **SMS Portal**: Desktop-first (with mobile support)
- **Onboarding**: Tablet/mobile-first for walking around

### Different Requirements
- **SMS Portal**: Real-time, complex workflows, reports
- **Onboarding**: Offline-first, camera-heavy, simple flow

---

## SYSTEM ARCHITECTURE

### Two Connected Systems
```
┌─────────────────────┐         ┌──────────────────────┐
│  Onboarding Wizard  │ ←----→  │     SMS Portal       │
│  onboard.sms.com    │  API    │    app.sms.com       │
│                     │         │                      │
│  - Data collection  │         │  - Daily operations  │
│  - Photo capture    │         │  - Fault reporting   │
│  - Progress track   │         │  - Maintenance       │
│  - Export tools     │         │  - Analytics         │
└─────────────────────┘         └──────────────────────┘
         │                                 │
         └────────────┬────────────────────┘
                      │
                 ┌────▼─────┐
                 │ Database  │
                 │PostgreSQL │
                 └───────────┘
```

### Shared Components
```
┌─── Shared Between Systems ───┐
│                              │
│ • Authentication (JWT)       │
│ • Database models            │
│ • File storage (S3)          │
│ • Validation rules           │
│ • API contracts              │
│                              │
└──────────────────────────────┘
```

---

## ONBOARDING WIZARD TECH STACK

### Optimized for Mobile Data Collection
```
Frontend:
- Next.js (PWA capabilities)
- React Native Web (better mobile)
- Tailwind CSS
- Camera APIs
- IndexedDB for offline

Backend:
- Lightweight Node.js API
- Session management
- Queue processing
- Image optimization

Infrastructure:
- Separate subdomain
- CDN for assets
- Aggressive caching
- Mobile-optimized
```

---

## AUTHENTICATION BRIDGE

### Seamless Login Flow
```typescript
// Option 1: Direct SMS Login
onboard.sms.com → "Login with SMS Account" → app.sms.com/auth → token → back

// Option 2: Setup Token
// SMS Portal generates one-time setup token
const setupToken = generateSetupToken({
  company_id: 'xxx',
  vessel_id: 'yyy',
  expires: '7 days',
  permissions: ['create_equipment', 'upload_photos']
});

// Share with person doing setup
"Go to onboard.sms.com/setup/ABC123"
```

### Setup Token Approach (Recommended)
```
SMS Manager: 
1. Clicks "Setup New Vessel"
2. Gets link: onboard.sms.com/setup/ABC123
3. Sends to person on vessel

Person on Vessel:
1. Opens link on tablet
2. No login required
3. Starts equipment tour
4. Data flows to main system
```

---

## DATA FLOW

### During Onboarding
```
Tablet → Onboarding API → Temp Storage → Validation → Main Database
   ↓                          ↓
Photos → Image Service → Compressed → S3 Storage
```

### After Completion
```
Onboarding System → "Setup Complete" → SMS Portal
                         ↓
                  Enable vessel in main app
                  Notify managers
                  Archive onboarding session
```

---

## BENEFITS OF SEPARATION

### 1. Independent Development
- Build/deploy without affecting main app
- Different team could maintain
- Faster iterations
- Experimental features

### 2. Optimized Performance
- Tiny bundle size for mobile
- Offline-first architecture
- Camera-optimized
- No heavy dashboard code

### 3. Cleaner Codebase
- SMS Portal stays focused
- No setup wizards cluttering
- Clear separation of concerns
- Easier to maintain

### 4. Better Security
- Limited permissions
- Time-boxed access
- No daily credentials needed
- Audit trail separate

### 5. Scalability
- Can handle multiple setups
- Won't slow main system
- Separate infrastructure
- Different scaling needs

---

## INTEGRATION POINTS

### 1. Initial Setup
```typescript
// SMS Portal
async function createVesselSetup(vesselId: string) {
  const token = await api.post('/setup/token', {
    vessel_id: vesselId,
    expires_in: '7d',
    permissions: ['equipment.create', 'photos.upload']
  });
  
  return {
    setup_url: `https://onboard.sms.com/setup/${token}`,
    expires: token.expires_at,
    qr_code: generateQR(setup_url)
  };
}
```

### 2. Progress Monitoring
```typescript
// SMS Portal polls for progress
async function checkSetupProgress(vesselId: string) {
  const progress = await api.get(`/setup/progress/${vesselId}`);
  
  return {
    status: progress.status, // 'not_started' | 'in_progress' | 'complete'
    equipment_count: progress.equipment_count,
    photos_count: progress.photos_count,
    last_activity: progress.last_activity,
    completion_percentage: progress.percentage
  };
}
```

### 3. Completion Webhook
```typescript
// Onboarding notifies SMS Portal
async function onSetupComplete(session: OnboardingSession) {
  await smsPortalApi.post('/webhook/setup-complete', {
    vessel_id: session.vessel_id,
    equipment_count: session.equipment.length,
    photos_count: session.photos.length,
    completed_by: session.user,
    completed_at: new Date()
  });
}
```

---

## USER JOURNEY

### For Vessel Manager
1. Logs into SMS Portal
2. Clicks "Setup New Vessel"
3. Gets setup link/QR code
4. Sends to vessel
5. Monitors progress
6. Gets notification when complete
7. Vessel ready to use

### For Person on Vessel
1. Receives setup link
2. Opens on tablet
3. No complex login
4. Follows guided tour
5. Takes photos
6. Sees progress
7. Exports Excel backup
8. Done!

---

## DEPLOYMENT STRATEGY

### Phase 1: MVP
- Basic wizard flow
- Photo capture
- Progress tracking
- Excel export
- Direct database writes

### Phase 2: Enhanced
- Offline mode
- Better image recognition
- Voice notes
- Barcode scanning
- Duplicate detection

### Phase 3: Scale
- Multi-language
- Custom workflows
- Integration APIs
- White-label options

---

## COST/BENEFIT ANALYSIS

### Development Effort
- 3-4 weeks for MVP
- Reuses validation logic
- Simpler than expected
- High impact feature

### Business Value
- Major differentiator
- Reduces support 80%
- Faster onboarding
- Better data quality
- Could charge for "Professional Setup"

This separation makes both systems better at their jobs!