# Practical Configuration Wizard Design

## The Reality-Based Approach

### Start with What We Have:
- Mechanical dashboards ✓ (suits most companies)
- Electrical dashboards ✓ (suits most companies)  
- HSE dashboard ✓ (good starting point, may need tweaks)
- Based on geotechnical drilling vessel

### The Smart Strategy:
1. Show current setup as the "standard template"
2. Let them keep/remove/add
3. If they ADD → they must specify details
4. Their configuration becomes a template for similar clients

## Configuration Wizard Flow

### Step 1: Show What's Included
```
Welcome! Here's what your dashboards will include after onboarding:

📊 MECHANICAL DASHBOARD (once equipment is documented)
✓ Equipment health status overview
✓ Maintenance scheduling calendar  
✓ Running hours tracking
✓ Fault reporting & history
✓ Parts inventory management

📊 ELECTRICAL DASHBOARD (once equipment is documented)  
✓ Electrical systems overview
✓ Power distribution monitoring
✓ Electrical maintenance logs
✓ Safety inspection tracking
✓ Compliance status

📊 HSE DASHBOARD
✓ Safety alerts board
✓ Incident reporting system
✓ Permit management
✓ Risk assessments
✓ Training records

📋 FORMS YOUR TECHNICIANS WILL USE:
✓ Equipment documentation form
✓ Daily maintenance reports
✓ Equipment inspection checklists
✓ Fault report forms
✓ Parts requisition forms
✓ Safety observation cards

NOTE: Your technicians will document all vessel equipment 
in the next phase. The dashboards will populate with YOUR 
specific equipment data.

[This looks good ✓] [I need to customize →]
```

### Step 2: Customization Options (if selected)
```
What would you like to modify?

REMOVE features I don't need:
□ Parts inventory (we use separate system)
□ Training records (handled by HR)
□ Generator monitoring (no generators)

ADD features I need:
□ Additional dashboard
□ Custom forms/reports
□ Special equipment types
□ Industry-specific compliance

[Continue with current ✓] [Specify additions →]
```

### Step 3: Addition Details (if needed)
```
You want to add: [Custom Dashboard]

Please describe what you need:

Dashboard Name: [Production Monitoring]

What data should it track?
- Daily production volumes
- Equipment efficiency %  
- Downtime reasons
- Quality metrics

How should it be displayed?
○ Charts/graphs
○ Data tables
○ Status indicators
○ All of the above

Who needs access?
☑ Managers
☑ Operations team
□ Technicians
□ Everyone

[Need help explaining? Schedule call →]
```

### Step 4: Form Customization
```
You want to add: [Custom Report]

Report Name: [Drilling Operations Log]

What fields needed? (Add rows as needed)
┌─────────────────┬────────────┬───────────┐
│ Field Name      │ Type       │ Required? │
├─────────────────┼────────────┼───────────┤
│ Depth reached   │ Number     │ Yes       │
│ Mud weight      │ Decimal    │ Yes       │
│ Rate of penetr. │ Number     │ Yes       │
│ Formation type  │ Dropdown   │ No        │
│ [+ Add field]   │            │           │
└─────────────────┴────────────┴───────────┘

How often is this completed?
○ Every shift
○ Daily
○ Weekly
○ As needed
```

### Step 5: Review & Document
```
Configuration Summary:

KEEPING:
✓ All mechanical features
✓ All electrical features  
✓ Most HSE features

REMOVING:
✗ Training records module

ADDING:
+ Production Monitoring Dashboard
  - 4 custom metrics
  - Manager/Operations access
  
+ Drilling Operations Log
  - 12 custom fields
  - Completed per shift
  
⚠️ Custom additions may take 1-2 weeks to implement

[Confirm Configuration] [Request Changes]
```

## Building the Template Library

### First Client (Geotechnical Drilling):
```json
{
  "templateName": "Geotechnical Drilling Vessel",
  "basedOn": "standard",
  "additions": {
    "dashboards": ["production_monitoring"],
    "forms": ["drilling_log", "core_sample_record"],
    "customFields": ["depth", "mudWeight", "penetrationRate"]
  },
  "removed": ["training_records"],
  "clientNotes": "Focus on drilling operations tracking"
}
```

### Second Client (Similar vessel):
```
We have a template from a similar operation!

[Use Geotechnical Template] [Start from Standard]
```

### Building Knowledge:
- Each new vessel type = learning opportunity
- Configuration becomes reusable template
- Library grows organically
- Future clients benefit from past work

## Handling Unknown Vessel Types

When we encounter new vessel type:
```
We haven't configured this vessel type before.
This means we need more details from you.

Option 1: Detailed Configuration Session
- 1-hour screen share
- We learn your operations
- Build custom configuration
- Becomes template for future

Option 2: Self-Document
- Fill detailed questionnaire
- Upload sample reports/forms
- We build configuration
- Review together

Your configuration helps future clients!
```

## Smart Defaults Based on Current System

Since mechanical/electrical work for most:
```javascript
const standardTemplate = {
  dashboards: {
    mechanical: {
      enabled: true,
      widgets: ['equipment_health', 'maintenance_schedule', 'running_hours']
    },
    electrical: {
      enabled: true,
      widgets: ['power_overview', 'generator_status', 'distribution']
    },
    hse: {
      enabled: true,
      widgets: ['safety_alerts', 'incidents', 'permits'],
      note: 'May need industry-specific adjustments'
    }
  },
  forms: {
    standard: ['maintenance_report', 'fault_report', 'inspection_checklist']
  }
};
```

## Progressive Template Building

1. **Start**: One template (geotechnical drilling)
2. **Month 1**: Add tanker template after first tanker client
3. **Month 2**: Add container template
4. **Month 6**: 10+ templates covering 90% of vessels
5. **Year 1**: Rarely need custom configuration

## Configuration Tracking

```sql
-- Track what clients add/remove
CREATE TABLE configuration_analytics (
  id UUID PRIMARY KEY,
  vessel_type VARCHAR(100),
  feature_added VARCHAR(255),
  feature_removed VARCHAR(255),
  custom_requirement TEXT,
  created_at TIMESTAMP
);

-- Use data to improve templates
-- "80% of tankers remove training module" → Remove from tanker template
-- "60% add tank cleaning forms" → Add to tanker template
```

## Bottom Line

This approach:
- Starts with reality (your current dashboards)
- Grows organically with each client
- Builds valuable IP (template library)
- Gets smarter over time
- Minimizes custom work through reuse

Perfect balance of automation and customization!