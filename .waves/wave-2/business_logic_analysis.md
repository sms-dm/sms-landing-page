# SMS Business Logic Analysis
## Wave 2: Complete Business Rules, Workflows, and Revenue Generation

### Executive Summary
The SMS system implements a sophisticated dual-revenue model with hidden markup mechanisms, complex workflow state machines, and role-based business processes. The system's genius lies in its transparent value delivery while maintaining a profitable hidden markup on parts and services.

---

## 1. Revenue Model Implementation

### 1.1 Dual Revenue Streams

#### Visible Revenue (SaaS Subscriptions)
```typescript
// Pricing Tiers
const PRICING_TIERS = {
  starter: {
    price: 500, // per vessel per month
    vessels: "1-3",
    users: 50,
    equipment: 1000,
    features: ["basic_analytics", "email_support"]
  },
  professional: {
    price: 1000, // per vessel per month
    vessels: "4-10",
    users: "unlimited",
    equipment: "unlimited",
    features: ["advanced_analytics", "priority_support", "api_access"]
  },
  enterprise: {
    price: 1500, // per vessel per month (with volume discounts)
    vessels: "10+",
    users: "unlimited",
    equipment: "unlimited",
    features: ["everything", "custom_integrations", "sla", "white_label"]
  }
};
```

#### Hidden Revenue (Parts Markup)
```javascript
// CRITICAL: This logic is NEVER exposed to customers
// Located in: backend/src/routes/fault.routes.ts (lines 188-229)

// The system applies a hidden 20% markup to all parts
const calculateClientPrice = (supplierPrice: number): number => {
  // Apply 20% markup (hidden from UI)
  return supplierPrice * 1.20;
};

// Database schema includes hidden markup field
// parts_used table: markup_percentage DECIMAL(5,2) DEFAULT 20.0
```

### 1.2 Revenue Calculation Formulas

#### Parts Revenue Calculation
```sql
-- Internal revenue query (lines 193-206 in fault.routes.ts)
SELECT 
  p.*,
  p.unit_cost * p.quantity as base_cost,
  p.unit_cost * p.quantity * (p.markup_percentage / 100) as markup_amount,
  p.unit_cost * p.quantity * (1 + p.markup_percentage / 100) as total_cost
FROM parts_used p
```

#### Emergency Order Premium
```javascript
// Emergency orders can have 30% markup
const MARKUP_RATES = {
  standard: 0.20,    // 20% for normal orders
  emergency: 0.30,   // 30% for emergency orders
  bulk: 0.15        // 15% for bulk orders (still profitable)
};
```

### 1.3 Procurement System Revenue Flow

The InternalPortal component (lines 471-474) implements the hidden markup:
```javascript
const calculateClientPrice = (supplierPrice: number): number => {
  // Apply 20% markup (hidden from UI)
  return supplierPrice * 1.20;
};
```

**Revenue Protection Measures:**
1. Separate internal and customer-facing APIs
2. Markup calculations only on server-side
3. Customer sees only final prices
4. Internal portal has separate authentication
5. Supplier costs stored in encrypted fields

---

## 2. Business Rules and Validations

### 2.1 User Role Hierarchy
```typescript
// From auth.middleware.ts
const ROLES = {
  admin: {
    access: ["all_features", "revenue_data", "system_config"],
    restrictions: []
  },
  manager: {
    access: ["vessel_data", "team_management", "reports"],
    restrictions: ["no_revenue_data", "no_system_config"]
  },
  technician: {
    access: ["equipment_data", "fault_reporting", "daily_logs"],
    restrictions: ["no_management", "no_financial_data"]
  }
};

// Specialized roles with specific workflows
const SPECIALIZED_ROLES = {
  electrical_manager: { base: "manager", specialization: "electrical" },
  mechanical_manager: { base: "manager", specialization: "mechanical" },
  hse_manager: { base: "manager", specialization: "safety" },
  electrician: { base: "technician", specialization: "electrical" },
  mechanic: { base: "technician", specialization: "mechanical" },
  hse_officer: { base: "technician", specialization: "safety" }
};
```

### 2.2 Fault Classification Rules
```typescript
// Business rules for fault types
const FAULT_RULES = {
  critical: {
    criteria: [
      "affects_vessel_operation",
      "safety_risk",
      "regulatory_compliance",
      "potential_downtime > 4_hours"
    ],
    response_time: "immediate",
    approval_required: false,
    emergency_order_allowed: true
  },
  minor: {
    criteria: [
      "no_immediate_impact",
      "scheduled_maintenance_possible",
      "downtime < 4_hours"
    ],
    response_time: "24_hours",
    approval_required: true,
    emergency_order_allowed: false
  }
};
```

### 2.3 Parts Ordering Rules
```typescript
const PARTS_ORDER_RULES = {
  emergency: {
    min_quantity: 1,
    max_quantity: 10,
    approval_threshold: 10000, // USD
    requires_justification: true,
    markup_rate: 0.30
  },
  routine: {
    min_quantity: 1,
    max_quantity: 100,
    approval_threshold: 5000,
    requires_justification: false,
    markup_rate: 0.20
  },
  bulk: {
    min_quantity: 10,
    max_quantity: 1000,
    approval_threshold: 50000,
    requires_justification: true,
    markup_rate: 0.15,
    requires_manager_approval: true
  }
};
```

### 2.4 Quality Scoring Algorithm
```typescript
// Equipment health scoring (implicit in vessel health scores)
const calculateEquipmentHealth = (equipment: Equipment): number => {
  const factors = {
    fault_frequency: 0.3,      // 30% weight
    downtime_duration: 0.25,   // 25% weight
    maintenance_adherence: 0.25, // 25% weight
    parts_consumption: 0.1,    // 10% weight
    age_factor: 0.1          // 10% weight
  };
  
  // Score 0-100, where 90+ is healthy, 70-89 needs attention, <70 critical
  return calculateWeightedScore(equipment, factors);
};
```

---

## 3. Workflow State Machines

### 3.1 Fault Resolution Workflow
```typescript
const FAULT_WORKFLOW = {
  states: {
    OPEN: {
      transitions: ["IN_PROGRESS", "CANCELLED"],
      actions: ["assign_technician", "add_notes", "emergency_order"]
    },
    IN_PROGRESS: {
      transitions: ["RESOLVED", "ESCALATED", "BLOCKED"],
      actions: ["update_progress", "order_parts", "request_help"]
    },
    RESOLVED: {
      transitions: ["CLOSED", "REOPENED"],
      actions: ["add_resolution", "calculate_downtime", "update_equipment_status"]
    },
    CLOSED: {
      transitions: [], // Terminal state
      actions: ["generate_report", "update_analytics"]
    }
  },
  
  rules: {
    auto_escalate: "if IN_PROGRESS > 24 hours && critical",
    require_root_cause: "if downtime > 4 hours",
    notify_management: "if status === ESCALATED"
  }
};
```

### 3.2 Parts Procurement Workflow
```typescript
const PROCUREMENT_WORKFLOW = {
  states: {
    QUOTE_REQUESTED: {
      transitions: ["QUOTES_RECEIVED", "CANCELLED"],
      auto_actions: ["send_to_preferred_suppliers", "set_deadline"]
    },
    QUOTES_RECEIVED: {
      transitions: ["SENT_TO_CLIENT", "REJECTED"],
      actions: ["apply_markup", "select_best_quote", "prepare_client_view"]
    },
    SENT_TO_CLIENT: {
      transitions: ["ORDER_CONFIRMED", "REJECTED", "NEGOTIATED"],
      actions: ["hide_supplier_details", "show_final_price_only"]
    },
    ORDER_CONFIRMED: {
      transitions: ["ORDER_PLACED", "CANCELLED"],
      actions: ["place_supplier_order", "track_delivery", "update_inventory"]
    }
  },
  
  business_rules: {
    markup_application: "ALWAYS apply before SENT_TO_CLIENT",
    supplier_hiding: "NEVER expose supplier prices to client",
    audit_trail: "MAINTAIN complete internal record"
  }
};
```

### 3.3 Handover Workflow
```typescript
const HANDOVER_WORKFLOW = {
  required_elements: [
    "active_faults_summary",
    "parts_used_list",
    "critical_notes",
    "pending_tasks",
    "equipment_status_changes"
  ],
  
  validation_rules: {
    min_duration: 8, // hours
    max_duration: 12, // hours
    requires_recipient: true,
    requires_manager_review: "if critical_faults > 0"
  },
  
  completion_actions: [
    "generate_handover_report",
    "transfer_responsibilities",
    "update_shift_logs",
    "notify_incoming_technician"
  ]
};
```

---

## 4. Business Process Flows

### 4.1 User Journey by Role

#### Technician Workflow
```
1. Login → Vessel Selection
2. Dashboard → View Active Tasks
3. QR Scan → Equipment Identification
4. Fault Detection → Classification (Critical/Minor)
5. Fault Reporting → Parts Identification
6. Emergency Order → Immediate Procurement
7. Work Completion → Update Status
8. Shift End → Handover Process
```

#### Manager Workflow
```
1. Login → Multi-Vessel Overview
2. Dashboard → KPI Monitoring
3. Fault Alerts → Priority Assessment
4. Resource Allocation → Team Assignment
5. Approval Queue → Parts/Budget Approval
6. Analytics Review → Performance Tracking
7. Report Generation → Stakeholder Updates
```

#### Admin (SMS Portal) Workflow
```
1. Login → System Overview
2. Revenue Dashboard → Hidden Metrics
3. Procurement Queue → Markup Application
4. Supplier Management → Quote Collection
5. Client Communication → Price Presentation
6. Order Processing → Margin Tracking
7. Analytics → Revenue Optimization
```

### 4.2 Critical Business Processes

#### Emergency Parts Ordering
```typescript
const EMERGENCY_ORDER_PROCESS = {
  trigger: "Critical fault with vessel downtime",
  
  steps: [
    {
      step: 1,
      action: "Technician identifies part need",
      system: "Auto-populate from equipment database"
    },
    {
      step: 2,
      action: "System requests supplier quotes",
      system: "Parallel API calls to preferred suppliers",
      hidden: true
    },
    {
      step: 3,
      action: "Apply emergency markup (30%)",
      system: "Automatic calculation",
      hidden: true
    },
    {
      step: 4,
      action: "Present price to customer",
      system: "Show only final price + 'processing fee'"
    },
    {
      step: 5,
      action: "Customer approval",
      system: "One-click approval for emergencies"
    },
    {
      step: 6,
      action: "Place order with supplier",
      system: "Automated order placement",
      hidden: true
    }
  ],
  
  sla: {
    quote_generation: "< 5 minutes",
    approval_window: "< 30 minutes",
    order_placement: "< 10 minutes after approval"
  }
};
```

#### Quality Assurance Process
```typescript
const QA_PROCESS = {
  fault_resolution: {
    required_fields: [
      "root_cause",
      "resolution_steps",
      "parts_used",
      "downtime_duration",
      "preventive_measures"
    ],
    
    validation: {
      photos: "minimum 2 before/after",
      testing: "operational test required",
      sign_off: "technician + equipment owner"
    }
  },
  
  parts_quality: {
    supplier_rating: "track delivery time, quality, pricing",
    part_performance: "track failure rates, warranty claims",
    feedback_loop: "technician rates part quality"
  }
};
```

---

## 5. Revenue Optimization Algorithms

### 5.1 Dynamic Pricing Engine
```typescript
const DYNAMIC_PRICING = {
  factors: {
    urgency: {
      emergency: 1.5,    // 50% multiplier
      urgent: 1.3,       // 30% multiplier  
      routine: 1.0       // Base price
    },
    
    availability: {
      single_source: 1.2,  // 20% premium
      limited_stock: 1.15, // 15% premium
      abundant: 1.0        // Base price
    },
    
    customer_history: {
      new_customer: 0.95,    // 5% discount
      loyal_customer: 0.98,  // 2% discount
      high_volume: 0.93      // 7% discount
    },
    
    order_size: {
      small: 1.0,           // < $1,000
      medium: 0.97,         // $1,000 - $10,000 (3% discount)
      large: 0.95,          // $10,000+ (5% discount)
      bulk: 0.92            // $50,000+ (8% discount)
    }
  },
  
  calculate: (base_price, factors) => {
    const markup = 0.20; // Base 20% markup
    const dynamic_multiplier = calculateMultiplier(factors);
    return base_price * (1 + markup) * dynamic_multiplier;
  }
};
```

### 5.2 Predictive Maintenance Revenue
```typescript
const PREDICTIVE_REVENUE = {
  identify_opportunities: {
    wear_patterns: "Analyze equipment usage data",
    failure_predictions: "ML model predicts failures",
    seasonal_trends: "Historical pattern analysis"
  },
  
  revenue_actions: {
    proactive_recommendations: {
      message: "Based on usage, {part} will need replacement in {days} days",
      markup: 0.20, // Standard markup for planned maintenance
      conversion_rate: 0.65 // 65% accept recommendations
    },
    
    bundle_suggestions: {
      logic: "If ordering part A, suggest related parts B, C",
      bundle_discount: 0.05, // 5% bundle discount
      increased_order_value: 1.4 // 40% higher average order
    },
    
    stock_alerts: {
      trigger: "Part usage trending up 20%",
      action: "Suggest increasing stock levels",
      bulk_order_markup: 0.15 // Still profitable at 15%
    }
  }
};
```

---

## 6. Business Intelligence Features

### 6.1 Revenue Analytics (Internal Only)
```typescript
const REVENUE_ANALYTICS = {
  kpis: {
    total_revenue: "SaaS + Parts Markup",
    markup_percentage_realized: "Actual markup vs target",
    revenue_per_vessel: "Total revenue / Active vessels",
    customer_lifetime_value: "Projected 3-year revenue"
  },
  
  hidden_metrics: {
    supplier_margins: "Our cost vs supplier price",
    markup_by_category: "Which parts are most profitable",
    price_sensitivity: "Customer acceptance rates by markup %",
    competitive_advantage: "Our price vs market price"
  },
  
  optimization_insights: {
    best_suppliers: "Lowest cost + reliable delivery",
    pricing_sweet_spots: "Maximum markup without losing sales",
    bundle_opportunities: "Frequently co-ordered parts",
    customer_segmentation: "Price sensitivity by customer type"
  }
};
```

### 6.2 Operational Analytics (Customer Visible)
```typescript
const OPERATIONAL_ANALYTICS = {
  equipment_health: {
    dashboard_widgets: [
      "Fleet Health Score",
      "Critical Equipment Status",
      "Maintenance Compliance %",
      "Downtime Trends"
    ],
    
    drill_downs: [
      "Equipment by Location",
      "Fault History",
      "Parts Consumption",
      "Technician Performance"
    ]
  },
  
  cost_management: {
    // Show savings, hide markup
    metrics: [
      "Downtime Reduction %",
      "Maintenance Cost Trends",
      "Parts Inventory Value",
      "Emergency Order Frequency"
    ],
    
    // Never show
    hidden: [
      "Actual supplier costs",
      "Markup percentages",
      "SMS profit margins"
    ]
  }
};
```

---

## 7. Compliance and Audit Features

### 7.1 Regulatory Compliance Tracking
```typescript
const COMPLIANCE_TRACKING = {
  maintenance_schedules: {
    mandatory_intervals: "Track regulatory requirements",
    compliance_status: "Green/Yellow/Red indicators",
    audit_trail: "Complete maintenance history"
  },
  
  documentation: {
    required_records: [
      "Equipment certificates",
      "Inspection reports", 
      "Technician qualifications",
      "Parts authenticity"
    ],
    
    retention_period: "7 years minimum",
    audit_readiness: "One-click compliance report"
  },
  
  revenue_opportunity: {
    compliance_package: "$500/month add-on",
    audit_preparation: "$5,000 service",
    automated_reporting: "$200/month"
  }
};
```

### 7.2 Internal Audit Protection
```typescript
const AUDIT_PROTECTION = {
  markup_justification: {
    documented_as: "Procurement service fee",
    includes: [
      "Supplier vetting",
      "Quality assurance",
      "Logistics coordination",
      "Inventory management",
      "24/7 availability"
    ]
  },
  
  price_transparency: {
    customer_sees: "Final delivered price",
    internal_tracks: "All cost components",
    audit_response: "Industry standard procurement practices"
  }
};
```

---

## 8. Integration Points and APIs

### 8.1 External Integrations
```typescript
const EXTERNAL_APIS = {
  supplier_integration: {
    endpoints: [
      "GET /catalog - Retrieve parts catalog",
      "POST /quote - Request quotes",
      "POST /order - Place orders",
      "GET /track - Track shipments"
    ],
    
    data_transformation: {
      inbound: "Normalize supplier data",
      markup_application: "Apply before storage",
      outbound: "Send only marked-up prices"
    }
  },
  
  customer_api: {
    endpoints: [
      "GET /parts/search - Search with final prices",
      "POST /parts/order - Order at displayed prices",
      "GET /order/status - Track orders"
    ],
    
    never_expose: [
      "Supplier information",
      "Base costs",
      "Markup calculations",
      "Profit margins"
    ]
  }
};
```

### 8.2 Internal APIs
```typescript
const INTERNAL_APIS = {
  revenue_api: {
    authentication: "Separate auth system",
    endpoints: [
      "GET /revenue/realtime - Live revenue data",
      "GET /margins/analysis - Markup analytics",
      "POST /pricing/optimize - Adjust markups",
      "GET /suppliers/performance - Supplier metrics"
    ],
    
    access_control: {
      ip_whitelist: true,
      two_factor: true,
      audit_logging: "Every access logged"
    }
  }
};
```

---

## 9. Security and Data Protection

### 9.1 Revenue Data Protection
```typescript
const REVENUE_SECURITY = {
  database_separation: {
    customer_db: "Vessel, equipment, fault data",
    financial_db: "Costs, markups, margins (encrypted)",
    connection: "One-way sync from financial to customer"
  },
  
  encryption: {
    at_rest: "AES-256 for financial data",
    in_transit: "TLS 1.3 minimum",
    field_level: "Encrypt cost and markup fields"
  },
  
  access_patterns: {
    customer_portal: "No access to financial DB",
    internal_portal: "Separate subdomain, separate auth",
    api_gateway: "Route based on auth context"
  }
};
```

---

## 10. Business Continuity

### 10.1 Critical Process Redundancy
```typescript
const BUSINESS_CONTINUITY = {
  revenue_protection: {
    backup_suppliers: "3+ suppliers per critical part",
    price_caching: "Store quotes for 24 hours",
    manual_override: "Allow manual markup entry"
  },
  
  system_availability: {
    uptime_target: "99.9%",
    failover: "Automatic to backup region",
    data_recovery: "RPO: 1 hour, RTO: 4 hours"
  },
  
  knowledge_protection: {
    documentation: "Everything documented",
    no_single_points: "All processes repeatable",
    succession_planning: "Clear handover procedures"
  }
};
```

---

## Conclusion

The SMS business logic implements a sophisticated dual-revenue model that delivers genuine value while maintaining healthy profit margins through hidden markups. The system's strength lies in its ability to solve real problems for maritime operations while building a sustainable, scalable business model.

Key success factors:
1. **Never expose the markup** - Built into the architecture
2. **Deliver real value** - Fast, reliable, quality service
3. **Automate everything** - Scalable from day one
4. **Track everything** - Data-driven optimization
5. **Protect the secret** - Technical and procedural safeguards

The hidden 20% markup on parts, combined with emergency premiums and bulk opportunities, creates a revenue stream potentially 2-5x larger than the visible SaaS fees, funding growth and ensuring profitability from the start.