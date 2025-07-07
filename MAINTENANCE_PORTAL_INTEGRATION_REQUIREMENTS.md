# Maintenance Portal Integration Requirements

## Critical Features to Build into REAL Maintenance Portal

### 1. Parts Intelligence System
```javascript
// MUST HAVE - Cross-reference intelligence
partsIntelligence = {
  showWhereUsed: true,        // "Used in 6 locations (4 critical)"
  stockVsCritical: true,      // "2 units for 4 critical systems"
  autoWarnings: true,         // "Low stock for critical usage"
  standardization: true       // "5 different types - consider standardizing"
};
```

### 2. Purchase Order → Stock Update Flow
```javascript
// CRITICAL - Automatic stock management
purchaseOrderIntegration = {
  // When creating PO in maintenance portal
  onCreate: {
    applyMarkup: "20% hidden",
    createPendingStock: true,
    notifyTechs: true,
    trackDelivery: true
  },
  
  // On delivery
  onDelivery: {
    techConfirms: "One-click confirmation",
    autoUpdateStock: true,
    createAuditLog: true,
    photoProof: optional
  }
};
```

### 3. Email Notification System
```javascript
// Multiple sender addresses for different purposes
emailConfiguration = {
  addresses: {
    "notifications@": "System notifications",
    "inspections@": "Maintenance due dates",
    "alerts@": "Critical failures",
    "orders@": "Purchase order updates"
  },
  
  automatedAlerts: {
    maintenanceDue: [-30, -7, 0, +7], // days
    stockLow: true,
    criticalFailure: true,
    deliveryExpected: true
  }
};
```

### 4. Manager Dashboard Enhancements
```javascript
// NEW FEATURES for managers
managerDashboard = {
  // Spare parts value tracking
  sparePartsValue: {
    total: "$145,000",
    byCriticality: true,
    topValueItems: true,
    auditReady: true
  },
  
  // Stock intelligence
  stockIntelligence: {
    currentLevels: true,
    pendingDeliveries: true,
    criticalShortages: true,
    crossReference: true
  },
  
  // Export capabilities
  exports: {
    formats: ["PDF", "Excel", "CSV"],
    types: [
      "Parts Intelligence Report",
      "Spare Parts Inventory",
      "Critical Stock Analysis"
    ]
  }
};
```

### 5. Critical Parts Management
```javascript
// Equipment criticality system
criticalityManagement = {
  levels: ["CRITICAL", "IMPORTANT", "STANDARD"],
  
  ifCritical: {
    requireFailureParts: true,
    trackStockLevels: true,
    priorityAlerts: true
  },
  
  reporting: {
    criticalPartslist: true,
    stockVsUsage: true,
    recommendations: true
  }
};
```

### 6. Onboarding Data Integration
```javascript
// Receiving data from onboarding portal
onboardingIntegration = {
  endpoint: "/api/import/vessel",
  
  dataReceived: {
    vessels: "Basic info",
    equipment: "With criticality",
    criticalParts: "With stock requirements",
    photos: "S3 URLs",
    documents: "Linked files"
  },
  
  autoProvision: {
    users: true,
    permissions: "Based on roles",
    notifications: "Welcome emails"
  }
};
```

### 7. API Endpoints to Create
```javascript
// For onboarding portal integration
requiredAPIs = {
  // Token management
  POST: "/api/onboarding/generate-token",
  POST: "/api/onboarding/validate-token",
  
  // Progress tracking
  POST: "/api/webhooks/onboarding-progress",
  GET: "/api/onboarding/status/:token",
  
  // Data import
  POST: "/api/import/vessel",
  POST: "/api/import/equipment/batch",
  
  // Stock management
  GET: "/api/parts/cross-reference/:partNumber",
  POST: "/api/purchase-orders/create",
  POST: "/api/stock/confirm-delivery",
  
  // Notifications
  POST: "/api/notifications/maintenance-due",
  POST: "/api/notifications/stock-alert"
};
```

### 8. Security Enhancements
```javascript
// Maritime compliance
security = {
  encryption: "AES-256 at rest",
  audit: "7-year retention",
  compliance: "IMO 2021 + IACS UR E26/E27",
  multiTenant: "Row-level security",
  backup: "Hourly with point-in-time recovery"
};
```

### 9. UI/UX Consistency
```javascript
// Match onboarding portal
uiRequirements = {
  framework: "React + TypeScript",
  styling: "Tailwind CSS + Shadcn/ui",
  mobileFirst: true,
  touchTargets: "44px minimum",
  theme: "Professional blues/grays"
};
```

### 10. Data Models to Update
```sql
-- Add to existing schema
ALTER TABLE equipment ADD COLUMN criticality VARCHAR(20);
ALTER TABLE equipment ADD COLUMN quality_score INTEGER;

CREATE TABLE critical_parts (
  id UUID PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id),
  part_number VARCHAR(100),
  description TEXT,
  causes_failure BOOLEAN DEFAULT true,
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 1
);

CREATE TABLE parts_cross_reference (
  part_number VARCHAR(100),
  equipment_id UUID REFERENCES equipment(id),
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (part_number, equipment_id)
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE,
  created_by UUID REFERENCES users(id),
  ordered_date TIMESTAMP,
  expected_delivery DATE,
  status VARCHAR(20),
  items JSONB,
  markup_amount DECIMAL(10,2), -- Hidden field
  confirmed_by UUID REFERENCES users(id),
  confirmed_date TIMESTAMP
);
```

### 11. Progressive Features
```javascript
// Build in phases
phase1 = {
  basicIntegration: "Receive onboarding data",
  stockTracking: "Basic in/out",
  criticalParts: "Flag and track"
};

phase2 = {
  purchaseOrders: "Full PO integration",
  partsIntelligence: "Cross-reference system",
  automatedAlerts: "Email notifications"
};

phase3 = {
  predictiveMaintenance: "AI predictions",
  supplierIntegration: "Direct ordering APIs",
  advancedAnalytics: "Cost optimization"
};
```

### 12. Revenue Protection
```javascript
// Don't forget the money maker!
revenueFeatures = {
  partsMarkup: {
    default: 20,
    emergency: 30,
    hiddenFrom: "customers",
    visibleTo: "SMS admin only"
  },
  
  reporting: {
    markupRevenue: "Monthly/yearly",
    byCompany: true,
    byVessel: true,
    exportable: "For accounting"
  }
};
```

## Testing Requirements

### Integration Tests
- [ ] Onboarding → Maintenance data flow
- [ ] PO creation → Stock update
- [ ] Critical parts warnings
- [ ] Email notifications
- [ ] Export functionality

### User Acceptance Tests  
- [ ] Tech can confirm deliveries easily
- [ ] Manager sees all intelligence reports
- [ ] Critical stock warnings work
- [ ] Mobile experience smooth
- [ ] Offline → Online sync

## Remember: The maintenance portal is where the MONEY is made through parts markup. Every feature should encourage ordering through the system!