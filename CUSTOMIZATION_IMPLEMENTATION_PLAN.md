# Customization Implementation Plan

## Quick Win: Configuration Before Technician Access

### Current Flow
1. Company registers → 2. Manager invites technicians → 3. Equipment documented

### New Flow  
1. Company registers → 2. **Configuration Phase** → 3. Manager invites technicians → 4. Equipment documented

## Database Schema Updates

```sql
-- Add to companies table
ALTER TABLE companies ADD COLUMN configuration JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN configuration_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE companies ADD COLUMN configuration_completed_at TIMESTAMP;

-- Configuration templates table
CREATE TABLE configuration_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  industry VARCHAR(100),
  base_config JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Track configuration changes
CREATE TABLE configuration_history (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  changed_by UUID REFERENCES users(id),
  previous_config JSONB,
  new_config JSONB,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## UI Changes Needed

### 1. Onboarding Portal - New Configuration Step

After company registration, before technician invites:

```typescript
// New page: ConfigurationPage.tsx
interface ConfigurationStep {
  selectTemplate: boolean;
  customizeDashboard: boolean;
  customizeForms: boolean;
  reviewAndConfirm: boolean;
}

const ConfigurationPage = () => {
  const [template, setTemplate] = useState('standard');
  const [dashboardConfig, setDashboardConfig] = useState({});
  const [formConfig, setFormConfig] = useState({});
  
  return (
    <ConfigurationWizard>
      <Step1SelectTemplate templates={industryTemplates} />
      <Step2DashboardBuilder config={dashboardConfig} />
      <Step3FormCustomizer config={formConfig} />
      <Step4Review onConfirm={saveConfiguration} />
    </ConfigurationWizard>
  );
};
```

### 2. Block Technician Access Until Configuration Complete

```typescript
// In ManagerDashboard.tsx
const canInviteTechnicians = company.configuration_status === 'completed';

{!canInviteTechnicians && (
  <Alert>
    Complete system configuration before inviting technicians
    <Button onClick={() => navigate('/configuration')}>
      Configure System
    </Button>
  </Alert>
)}
```

### 3. Simple Configuration Builder

```typescript
// DashboardBuilder.tsx - Drag and drop widget selector
const availableWidgets = [
  { id: 'equipment-health', name: 'Equipment Health Overview' },
  { id: 'maintenance-calendar', name: 'Maintenance Calendar' },
  { id: 'fault-trends', name: 'Fault Analysis' },
  { id: 'compliance-score', name: 'Compliance Metrics' },
  { id: 'parts-inventory', name: 'Parts Status' },
  { id: 'team-performance', name: 'Team Metrics' }
];

// Let them toggle on/off and arrange
```

## Maintenance Portal - Dynamic Loading

```typescript
// MaintenancePortal - DashboardPage.tsx
const DashboardPage = () => {
  const { company } = useAuth();
  const config = company.configuration?.dashboard || defaultConfig;
  
  return (
    <DynamicDashboard>
      {config.widgets.map(widgetId => (
        <DynamicWidget key={widgetId} type={widgetId} />
      ))}
    </DynamicDashboard>
  );
};
```

## Smart Template System

```javascript
const industryTemplates = {
  tanker: {
    name: "Tanker Vessel",
    dashboard: {
      widgets: ['equipment-health', 'compliance-score', 'chemical-inventory'],
      layout: 'tanker-optimized'
    },
    forms: {
      additionalFields: ['cargo-type', 'last-vetting-date', 'sire-inspection']
    }
  },
  container: {
    name: "Container Ship",
    dashboard: {
      widgets: ['equipment-health', 'reefer-monitoring', 'crane-status'],
      layout: 'container-optimized'
    },
    forms: {
      additionalFields: ['teu-capacity', 'crane-hours', 'reefer-count']
    }
  }
};
```

## Phased Rollout

### Phase 1: Basic Toggle (2 weeks)
- Simple on/off for features
- Choose from 3-4 templates
- Basic branding (logo, primary color)

### Phase 2: Advanced Config (4 weeks)
- Drag-drop dashboard builder
- Custom form fields
- Approval workflow builder

### Phase 3: Full Customization (8 weeks)
- API for custom widgets
- White-label options
- Custom integrations

## How to Manage the Workload

1. **Start Simple**: Just toggles and templates
2. **Charge for Complexity**: Basic = free, Advanced = paid
3. **Build Once, Configure Many**: Make everything config-driven
4. **Use Templates**: 80% will pick a template and make minor changes
5. **Defer Complex Requests**: "That's on our Enterprise roadmap"

## Revenue Model

```
Standard Package: $0
- Default dashboards
- Standard forms
- Basic branding

Professional: $2,000 setup + $200/month
- Custom dashboard layouts  
- Additional form fields
- Advanced workflows
- Priority support

Enterprise: $5,000+ setup + $500/month
- Fully custom everything
- API access
- White-label option
- Dedicated support
```

This turns your "can of worms" into a revenue stream while keeping it manageable!