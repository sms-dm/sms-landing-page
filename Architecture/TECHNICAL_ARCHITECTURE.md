# TECHNICAL ARCHITECTURE
## Building for Speed, Designed for Scale

### CORE PRINCIPLES
1. **Ship Fast**: Use proven technologies, no experiments
2. **Scale Later**: Architecture that can grow without rewrite
3. **Offshore Ready**: Works on ships with bad internet
4. **Cost Effective**: Start cheap, optimize when needed

---

## TECHNOLOGY STACK

### Frontend
**Framework**: React + TypeScript (already built)
**Styling**: Tailwind CSS (already implemented)
**State**: Context API → Redux later if needed
**Forms**: React Hook Form
**Charts**: Recharts
**PWA**: For mobile experience

### Backend  
**Runtime**: Node.js + Express (already built)
**Language**: TypeScript
**Database**: PostgreSQL (migrate from SQLite)
**ORM**: Prisma (type-safe, migrations)
**Auth**: JWT → Auth0 later if needed
**Queue**: Bull (for background jobs)

### Infrastructure
**Hosting**: DigitalOcean (simpler than AWS)
- Droplet: $20/month (2GB RAM)
- Managed PostgreSQL: $15/month  
- Spaces (S3 clone): $5/month
- Total: ~$40/month to start

**Monitoring**: 
- Sentry (errors) - Free tier
- Plausible (analytics) - $6/month
- UptimeRobot (monitoring) - Free

### Third Party Services
**Payments**: Stripe
**Email**: SendGrid (free tier)
**SMS**: Twilio (pay as you go)
**AI**: OpenAI API (when ready)
**Search**: PostgreSQL full-text → Elasticsearch later

---

## DATABASE SCHEMA

### Core Tables
```sql
-- Companies (multi-tenant)
companies
- id
- name
- slug
- branding (JSON)
- subscription_status
- created_at

-- Vessels
vessels  
- id
- company_id
- name
- type
- imo_number
- specs (JSON)

-- Users
users
- id
- company_id
- email
- password_hash
- role
- specialization

-- Equipment
equipment
- id
- vessel_id
- area
- name
- type
- serial_number
- qr_code
- specs (JSON)
- documents (JSON)

-- Faults
faults
- id
- equipment_id
- reported_by
- severity
- description
- status
- mttr_seconds (hidden)
- created_at
- resolved_at

-- Parts Orders
parts_orders
- id  
- fault_id
- part_name
- supplier_price
- customer_price (20% markup)
- status
- ordered_at

-- Handovers
handovers
- id
- user_id
- vessel_id
- content (JSON)
- completed_at
- rotation_end_date
```

---

## API STRUCTURE

### RESTful Endpoints
```
/api/auth
  POST /login
  POST /logout
  POST /refresh

/api/companies
  GET /:slug
  PUT /:id/branding

/api/vessels
  GET /
  GET /:id
  POST /:id/join-rotation

/api/equipment  
  GET /by-vessel/:vesselId
  GET /:id
  POST /
  PUT /:id

/api/faults
  GET /active
  POST /
  PUT /:id/resolve
  POST /:id/order-parts

/api/handovers
  GET /current
  POST /complete
  GET /history

/api/analytics
  GET /dashboard
  GET /mttr
  GET /costs
```

---

## SECURITY ARCHITECTURE

### Authentication
- JWT with refresh tokens
- Secure httpOnly cookies
- Role-based access control
- Session management

### Data Protection  
- Encryption at rest (PostgreSQL)
- Encryption in transit (HTTPS)
- Bcrypt for passwords
- Environment variables for secrets

### Multi-tenant Isolation
- Row-level security
- Company ID in every query
- No cross-tenant data access
- Separate S3 folders per company

### Audit Trail
- Every action logged
- IP tracking
- User agent tracking
- Immutable audit table

---

## OFFLINE ARCHITECTURE

### Progressive Web App
- Service worker for caching
- IndexedDB for local data
- Background sync API
- Conflict resolution

### Sync Strategy
1. **Read**: Cache everything on login
2. **Write**: Queue locally, sync when online
3. **Conflict**: Last-write-wins + audit trail
4. **Photos**: Compress and queue

### Critical Offline Features
- View equipment
- Report faults
- Take photos
- View procedures
- Complete handover

---

## SCALABILITY PLAN

### Phase 1 (0-20 customers)
- Single server
- PostgreSQL on same machine
- Basic backups
- Manual monitoring

### Phase 2 (20-100 customers)
- Separate database server
- Redis for caching
- CDN for assets
- Automated backups

### Phase 3 (100+ customers)
- Load balancer
- Multiple app servers
- Read replicas
- Elasticsearch
- Kubernetes

### Phase 4 (Enterprise)
- Multi-region deployment
- Real-time sync
- Advanced analytics
- API for integrations

---

## DEVELOPMENT WORKFLOW

### Version Control
```bash
main
├── develop
├── feature/[feature-name]
├── hotfix/[fix-name]
└── release/[version]
```

### Deployment Pipeline
1. Push to GitHub
2. Run tests
3. Build Docker image
4. Deploy to staging
5. Manual approval
6. Deploy to production

### Environments
- **Local**: Your machine
- **Staging**: staging.sms.com
- **Production**: app.sms.com

---

## IMMEDIATE SETUP TASKS

### Day 1-2
1. [ ] DigitalOcean account
2. [ ] Domain DNS setup  
3. [ ] SSL certificate
4. [ ] PostgreSQL migration
5. [ ] Environment variables
6. [ ] Basic CI/CD

### Day 3-4
1. [ ] Backup automation
2. [ ] Error tracking
3. [ ] Basic monitoring
4. [ ] Security headers
5. [ ] Rate limiting

### Day 5-7  
1. [ ] Payment integration
2. [ ] Email service
3. [ ] File upload system
4. [ ] Basic analytics
5. [ ] Load testing

---

## COST BREAKDOWN

### Monthly Costs
- Hosting: $40
- Database backups: $5  
- Monitoring: $6
- Email service: $0-50
- Domain/SSL: $2
**Total: ~$53-103/month**

### Per Customer Costs
- Storage: ~$0.50/vessel/month
- Bandwidth: ~$0.25/vessel/month
- Compute: Negligible at scale
**Margin: 95%+ on $500/month pricing**

---

## QUESTIONS FOR YOU

1. **Domain**: Is smartmaintenancesystems.com available? Alternatives?
2. **Staging**: Should we use subdomain or separate domain?
3. **Email**: Do you have Google Workspace for professional emails?

Ready to start building the production system?