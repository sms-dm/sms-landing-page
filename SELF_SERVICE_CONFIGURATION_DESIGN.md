# Self-Service Configuration Design

## The Vision: Smooth, Automated Onboarding

### Current Flow Issues:
- Requires 2-hour calls
- Needs technical staff time
- Delays onboarding
- Not scalable

### New Self-Service Flow:
1. Payment received → Activation code sent
2. Admin creates account
3. **NEW: Interactive Configuration Wizard** (30 minutes)
4. System auto-configures based on selections
5. Manager can NOW invite technicians
6. Optional: Book support call if needed

## Configuration Wizard Design

### Step 1: Industry Selection
```
Welcome! Let's customize SMS for your fleet.

What type of vessels do you operate?
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    🚢 Tanker    │ │  📦 Container   │ │  🛳️ Cruise     │
│                 │ │                 │ │                 │
│ Oil, Chemical,  │ │ Cargo vessels   │ │ Passenger       │
│ Product, LNG    │ │ with containers │ │ vessels         │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ⚓ Offshore    │ │  🎣 Fishing     │ │  🚤 Other       │
│                 │ │                 │ │                 │
│ Supply, Support │ │ Trawlers,       │ │ Specialized     │
│ Construction    │ │ Processing      │ │ vessels         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Step 2: Dashboard Preview & Customization
```
Here's your recommended dashboard layout:

[Live Preview of Tanker Dashboard]
├── Equipment Health Overview ✓
├── Compliance Tracker ✓
├── Chemical Inventory ✓
├── Maintenance Calendar ✓
├── Parts Status ✓
└── Vetting Preparation ✓

❓ What would you like to do?
○ Looks perfect, continue
○ Add/remove widgets (opens widget selector)
○ I need help (schedules call)
```

### Step 3: Documentation Requirements
```
Which compliance standards do you follow? (Select all)

☑ ISM Code          ☑ MARPOL
☑ SOLAS             ☐ MLC 2006
☐ ISPS Code         ☐ Polar Code
☐ ISO 9001          ☐ ISO 14001

Based on your selection, we'll include:
✓ ISM audit checklists
✓ MARPOL record books
✓ SOLAS equipment forms
✓ Custom fields for your requirements
```

### Step 4: Workflow Configuration
```
How should equipment approvals work?

○ Simple (Technician → Manager) ← Recommended
○ Department-based (Technician → Dept Head → Manager)
○ Complex (Custom approval chains)

Who can order parts?
☑ Managers
☑ Chief Engineers
☐ All Technicians
☐ Specific Roles (specify)
```

### Step 5: Branding (Optional)
```
Make it yours! (Skip if you want)

Company Colors:
Primary: [#002B5C] [Color Picker]
Secondary: [#0066CC] [Color Picker]

Logo: [Drop file or browse]
□ Use on all reports
□ Replace SMS logo in portal
```

### Step 6: Review & Confirm
```
Your Configuration Summary:

✓ Tanker vessel template
✓ 6 dashboard widgets configured
✓ ISM, MARPOL, SOLAS compliance
✓ Simple approval workflow
✓ Custom branding applied

[Preview Dashboard] [Preview Forms]

[← Back] [Confirm & Continue →]

Need help? [Schedule 15-min call]
```

## Smart Features

### 1. Progressive Disclosure
- Start simple, reveal complexity only if needed
- Most users stick with defaults
- "Advanced options" hidden unless requested

### 2. Live Preview
- Show actual dashboard as they configure
- Instant feedback on changes
- "Try before you buy" approach

### 3. Intelligent Defaults
```javascript
const industryDefaults = {
  tanker: {
    widgets: ['equipment', 'compliance', 'chemical', 'maintenance'],
    compliance: ['ISM', 'MARPOL', 'SOLAS'],
    workflows: 'simple',
    additionalFields: ['lastVetting', 'cargoType']
  }
};
```

### 4. Help Triggers
Monitor for confusion signals:
- Time on step > 5 minutes
- Multiple back/forward clicks
- Hovering over help icons

Auto-offer: "Need assistance? Chat with us or schedule a quick call"

### 5. Configuration Confidence Score
```
Configuration Completeness: 85%
✓ Industry selected
✓ Dashboard configured
✓ Compliance selected
⚠ Branding skipped (optional)

[Continue] [Review missing items]
```

## Implementation in Onboarding Portal

### Database Schema
```sql
ALTER TABLE companies ADD COLUMN configuration_status ENUM(
  'not_started',
  'in_progress', 
  'completed',
  'needs_support'
) DEFAULT 'not_started';

ALTER TABLE companies ADD COLUMN configuration_data JSONB;
ALTER TABLE companies ADD COLUMN configuration_completed_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN configuration_duration INTEGER; -- minutes
```

### Block Technician Access
```typescript
// ManagerDashboard.tsx
const canInviteTechnicians = company.configuration_status === 'completed';

{!canInviteTechnicians && (
  <Alert status="warning">
    <AlertIcon />
    Complete system configuration before inviting team members
    <Button onClick={() => navigate('/onboarding/configure')}>
      Configure System (15-30 min)
    </Button>
  </Alert>
)}
```

### Analytics & Optimization
Track where users struggle:
```javascript
// Track each step
analytics.track('configuration_step_completed', {
  step: 'industry_selection',
  timeSpent: 45, // seconds
  changed_defaults: false,
  requested_help: false
});

// Use data to improve flow
// "85% skip branding" → Make it less prominent
// "40% change widget layout" → Improve defaults
```

## Support Escalation Path

### Level 1: In-Wizard Help
- Tooltips on hover
- Example screenshots
- "What's this?" explanations

### Level 2: Chat Bot
- Answers common questions
- "How do I add custom fields?"
- "What's the difference between workflows?"

### Level 3: Quick Call
- 15-minute slots
- Screen sharing
- Only for stuck users

### Level 4: Full Configuration Service
- For Enterprise clients
- We do it for them
- Premium service ($$$)

## Time & Cost Savings

### Old Way:
- 2-hour call × $150/hour = $300 cost per client
- Requires scheduling coordination
- Not scalable

### New Way:
- 95% self-service = $0 cost
- 5% need 15-min call = $37.50 average cost
- Infinitely scalable
- Better user experience

## Revenue Opportunities

### Configuration Packages
```
Self-Service: Free
- Use wizard
- Standard templates
- Community support

Assisted: $500
- Priority chat support
- Configuration review
- 30-min setup call

White Glove: $2,000
- We configure everything
- Custom requirements gathering
- Dedicated onboarding manager
```

### Upsell Opportunities
During configuration, offer:
- "Add custom widget (+$500)"
- "Want API access? (+$200/month)"
- "Need more user roles? (+$100/month)"

## Success Metrics

1. **Completion Rate**: Target 90% self-service
2. **Time to Complete**: Target < 30 minutes
3. **Support Requests**: Target < 10%
4. **Configuration Quality**: Measure post-launch changes

## Bottom Line

This approach:
- Eliminates most manual work
- Provides better user experience
- Scales infinitely
- Generates data for improvement
- Opens upsell opportunities

The key is making it so intuitive that calling for help feels unnecessary!