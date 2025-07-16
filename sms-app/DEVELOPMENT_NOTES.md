# SMS Development Notes

## Project Vision
Smart Maintenance System (SMS) - Revolutionary maintenance platform for offshore vessels with hidden revenue model through parts markup.

## Key Differentiators
1. **Human-Centered**: Addresses technician isolation, knowledge sharing
2. **Hidden Revenue**: 20% markup invisible to clients
3. **AI-Powered**: Predictive maintenance, cross-fleet learning
4. **Offline-First**: Works without internet at sea

## User Personas

### Drilling Electrician (Primary)
- 28-day rotations
- Responsible for 40-50 pieces of equipment
- Needs: Quick fault reporting, access to schematics, peer support
- Pain points: Isolation, knowledge gaps, pressure during failures

### Vessel Manager
- Oversees multiple departments
- Needs: Cost tracking, downtime metrics, compliance reports
- Hidden from them: Parts markup

### Internal Admin (SMS Company)
- Sees true costs and markup
- Manages supplier relationships
- Tracks profitability per client

## Critical Features Status

### ✅ Completed
- Multi-tenant architecture with company branding
- Vessel selection with rotation tracking
- Shift countdown timer
- Vessel introduction for first-timers
- Technician dashboard with quick actions
- HSE updates integration
- Community board

### 🚧 In Progress
- Fault reporting workflow
- Equipment management
- Handover system

### 📋 Planned
- QR scanner for equipment
- AI diagnostic assistant
- Intelligent drawing search
- Parts ordering with hidden markup
- Manager dashboard
- Internal revenue portal

## Technical Decisions

### Frontend
- React + TypeScript (type safety)
- Tailwind CSS (rapid styling)
- React Query (data fetching)
- React Router v6 (navigation)

### Backend  
- Node.js + Express (simple, fast)
- SQLite for demo (PostgreSQL ready)
- JWT authentication
- RESTful API design

### Design Philosophy
- Dark theme (reduces eye strain)
- Ocean/marine imagery
- Futuristic but practical
- Mobile-responsive
- Offline-capable
- **Hover tooltips on all interactive elements** - Everything that navigates or performs an action should explain itself on hover

## UI/UX Standards
### Tooltips
- All navigation elements must have hover tooltips
- Format: Title (what it is) + Description (what it does) + Optional detail
- Color-coded to match the element's theme
- Appears below element by default
- 3-line maximum to keep concise
- Applied to: buttons, navigation cards, links, icons

## Demo Talking Points
1. "Timer runs invisibly" - Reduces technician stress
2. "20% markup hidden" - Revolutionary revenue model
3. "Cross-fleet learning" - AI improves from every fault
4. "Vessel introduction" - Reduces onboarding errors
5. "Forced handovers" - Ensures continuity

## Future Scaling
- Start with drilling contractors
- Expand to shipping companies
- Eventually: factories, mines, airports
- Anywhere with isolated technicians and expensive equipment

## Remember
- This is about people, not just equipment
- The isolation problem is as important as maintenance
- Revenue model must stay invisible
- Every feature should reduce technician stress