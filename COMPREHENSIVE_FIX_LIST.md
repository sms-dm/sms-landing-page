# SMS Comprehensive Fix List

## Priority 1: Revenue Model (Parts System)

### 1.1 Parts Inventory Management
- Add `minimum_stock` field to parts/inventory
- Create background job to check stock levels hourly
- Generate low stock alerts when quantity < minimum_stock
- Track consumption patterns per part

### 1.2 SMS Notification System  
- Create SMS company notification queue
- Send alerts to SMS admin BEFORE vessel sees low stock
- Add 24-hour SMS-first window for ordering
- Email notifications with "Review & Order" links

### 1.3 Parts Ordering Workflow
- Remove direct supplier ordering
- All orders route through SMS approval
- Add SMS order management dashboard
- Apply 20% markup automatically
- Generate purchase orders

### 1.4 Financial Integration
- Invoice generation system
- Payment tracking
- Multi-currency support
- Order history with margins

## Priority 2: Analytics & Performance

### 2.1 Real Analytics Dashboard
- Calculate ACTUAL metrics from database:
  - MTTR (Mean Time To Repair) per technician
  - First-time fix rate
  - Maintenance compliance %
  - Fault response times
- Remove all hardcoded/mock data
- Keep existing dashboard STYLE but with real data

### 2.2 Technician Performance Tracking
- Create performance metrics tables
- Track missed maintenance per technician
- Calculate efficiency scores
- Show trends over time
- Add to both manager and technician views

### 2.3 Vessel/Fleet Analytics
- Equipment availability %
- Downtime by category
- Parts consumption trends
- Compliance scores
- Monthly/quarterly comparisons

## Priority 3: Core Functionality Gaps

### 3.1 HSE Certificate Tracking
- Add certificate expiry to HSE equipment
- Calendar integration for renewals
- 30/60/90 day warnings
- Compliance dashboard
- Separate from maintenance schedules

### 3.2 Offline Capability
- Service worker implementation
- Local data caching
- Queue actions when offline
- Sync on reconnect
- Conflict resolution

### 3.3 Notification System Completion
- Complete notification types:
  - Low stock alerts (SMS first)
  - Maintenance due
  - Certificate expiry
  - Fault assignments
  - Performance alerts
- Email integration
- In-app notification center
- Push notifications setup

## Priority 4: UI/UX Consistency

### 4.1 Dashboard Styling
- Keep current modern dark theme
- Ensure all analytics use same chart library
- Consistent color coding:
  - Critical: Red (#ef4444)
  - Warning: Amber (#f59e0b)
  - Good: Green (#10b981)
  - Info: Blue (#3b82f6)

### 4.2 Remove Mock Data
- Replace static numbers with real calculations
- Hide features without data
- Show "No data yet" states appropriately
- Loading states for calculations

## Implementation Plan

### Phase 1: Revenue Critical (Week 1)
- Parts inventory system
- SMS notifications
- Order workflow
- Basic invoicing

### Phase 2: Analytics (Week 2)
- Real performance metrics
- Technician tracking
- Fleet analytics
- Remove mock data

### Phase 3: Features (Week 3)
- HSE certificates
- Offline mode
- Complete notifications

### Phase 4: Polish (Week 4)
- UI consistency
- Testing
- Bug fixes
- Documentation

## Database Changes Needed

```sql
-- Parts management
ALTER TABLE parts ADD COLUMN minimum_stock INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN lead_time_days INTEGER DEFAULT 14;
ALTER TABLE parts ADD COLUMN preferred_supplier VARCHAR(255);

-- Performance tracking
CREATE TABLE technician_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  vessel_id UUID REFERENCES vessels(id),
  period_start DATE,
  period_end DATE,
  mttr_hours DECIMAL,
  fix_rate DECIMAL,
  maintenance_compliance DECIMAL,
  faults_resolved INTEGER,
  response_time_avg INTEGER
);

-- Orders management  
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  vessel_id UUID REFERENCES vessels(id),
  status VARCHAR(50),
  supplier_cost DECIMAL,
  sms_price DECIMAL,
  markup_amount DECIMAL,
  currency VARCHAR(3),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP
);
```

## Success Metrics

1. **Revenue Model Working**
   - SMS notified of all low stock
   - All orders flow through SMS
   - 20% markup applied consistently

2. **Real Analytics**
   - All numbers calculated from actual data
   - Performance tracked accurately
   - Trends visible over time

3. **Complete System**
   - Notifications working
   - Offline capability
   - HSE compliance tracked

Ready to deploy multiple agents to tackle this list?