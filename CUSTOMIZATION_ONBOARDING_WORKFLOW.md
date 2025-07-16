# SMS Customization Onboarding Workflow

## The Challenge
Adding customization to onboarding creates a chicken-and-egg problem:
- Technicians need to know what to document
- But we don't know what to document until customization is complete
- This could significantly delay the onboarding process

## Proposed Solution: Three-Phase Onboarding

### Phase 1: Discovery & Planning (Week 1)
**Who**: Sales team + Client management
**What**: 
1. Client gets activation code after payment
2. Admin creates company account
3. **NEW: Configuration Workshop**
   - 2-hour video call with client
   - Show standard dashboards/documentation
   - Client selects what to keep/remove/add
   - Document specific requirements

**Deliverable**: Configuration specification document

### Phase 2: System Configuration (Week 2)
**Who**: SMS technical team
**What**:
1. Customize dashboards based on requirements
2. Set up documentation templates
3. Configure workflows and approvals
4. Create client-specific onboarding checklist
5. Test configuration with client admin

**Deliverable**: Customized system ready for data entry

### Phase 3: Equipment Documentation (Weeks 3-4)
**Who**: Client technicians
**What**:
1. Manager can NOW invite technicians
2. Technicians see customized forms
3. Document equipment per custom requirements
4. Manager approves with custom workflows

## Configuration Options

### Dashboard Customization Levels
1. **Basic** (Free)
   - Use standard layouts
   - Hide/show existing widgets
   - Basic branding (logo, colors)

2. **Professional** (+$2,000 setup)
   - Rearrange dashboard layouts
   - Custom KPI calculations
   - Department-specific views
   - Advanced branding

3. **Enterprise** (+$5,000 setup)
   - Fully custom dashboards
   - Custom data visualizations
   - API integrations
   - White-label option

### Documentation Customization
1. **Standard Forms**
   - Pre-built maintenance forms
   - Standard safety checklists
   - Generic approval workflows

2. **Custom Forms** (+$1,000)
   - Company-specific fields
   - Custom approval chains
   - Branded report templates
   - Compliance mappings

## Implementation Strategy

### Quick Start Templates
Create industry-specific templates:
- Tanker Operations Template
- Container Vessel Template  
- Offshore Support Template
- Cruise Ship Template

This gives clients a better starting point than generic forms.

### Configuration Builder Tool
Build a simple admin tool where we can:
1. Toggle features on/off
2. Rearrange dashboard widgets
3. Add custom fields to forms
4. Set up approval workflows

### Smart Defaults
- Start with everything enabled
- Let clients remove what they don't need
- This is psychologically better than starting empty

## Timeline Impact

**Current timeline**: 4 weeks
**With customization**: 
- Basic: Still 4 weeks (config during week 1-2)
- Professional: 5 weeks (+1 week config)
- Enterprise: 6-8 weeks (requires development)

## Revenue Opportunity

### Setup Fees
- Basic customization: Included
- Professional customization: $2,000
- Enterprise customization: $5,000+
- Rush customization (1 week): +50%

### Ongoing Fees
- Configuration changes: $500/change
- Quarterly reviews: $1,000/year
- Priority support: $2,000/year

## Technical Requirements

1. **Configuration Storage**
   ```json
   {
     "companyId": "uuid",
     "dashboards": {
       "main": {
         "layout": "custom-grid",
         "widgets": ["kpi-1", "chart-2", "custom-3"],
         "branding": {
           "primaryColor": "#002B5C",
           "logo": "url"
         }
       }
     },
     "forms": {
       "maintenance": {
         "fields": ["standard", "custom-field-1"],
         "requiredFields": ["customField1"],
         "approvalChain": ["role:technician", "role:manager"]
       }
     }
   }
   ```

2. **Dynamic Component Loading**
   - Dashboard widgets as configurable components
   - Form builder with drag-and-drop
   - Workflow engine for approvals

3. **Version Control**
   - Track configuration changes
   - Rollback capability
   - Change audit trail

## Risk Mitigation

1. **Scope Creep**
   - Define clear customization boundaries
   - Document what's included in each tier
   - Additional customization = additional fees

2. **Delay Risk**
   - Set firm deadlines for configuration decisions
   - Have "default proceed" clause in contract
   - Parallel track standard setup while discussing custom

3. **Support Burden**
   - Limit customization options initially
   - Build self-service configuration tools
   - Charge for ongoing changes

## Next Steps

1. Build configuration specification template
2. Create pricing tiers document
3. Develop basic configuration UI
4. Train sales team on customization options
5. Update contracts with customization terms

## Bottom Line

Yes, this adds complexity, but:
- It's a massive differentiator
- Justifies premium pricing
- Creates stickier customers
- Enterprise clients expect it

The key is to make it systematic, not custom development each time.