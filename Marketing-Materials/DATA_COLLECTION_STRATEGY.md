# DATA COLLECTION STRATEGY
## The Critical Foundation for SMS Success

### The Challenge
Getting equipment data into SMS efficiently is THE make-or-break factor. Without streamlined data collection, adoption fails.

---

## DATA COLLECTION METHODS

### Method 1: Client Self-Service Portal
**For: Engaged clients with available staff**

#### Equipment Data Collection App
- **Mobile-first design** for field use
- **Guided workflow** with mandatory fields
- **Photo requirements** with overlay guides
- **Barcode/Serial scanner** using phone camera
- **Offline capability** with sync later
- **Progress tracking** - "23/50 equipment completed"

#### Structured Input Forms
```
STEP 1: Basic Information
- Equipment Name: [_________]
- Manufacturer: [Dropdown]
- Model Number: [_________]
- Serial Number: [_________] [Scan]
- Year Installed: [_________]
- Location/Area: [Dropdown: HPU, Mud Room, etc.]

STEP 2: Photos (Required)
- Overall Equipment Photo [Camera guide overlay]
- Nameplate Photo [Must be readable]
- Current Condition [Multiple angles]
- QR Code Placement Photo [After sticker applied]

STEP 3: Specifications
- Power Rating: [_____] [kW/HP dropdown]
- Voltage: [_____] [V]
- Operating Pressure: [_____] [PSI/Bar]
- [Dynamic fields based on equipment type]

STEP 4: Documentation
- Drag & drop manuals (PDF)
- Drag & drop schematics (PDF)
- Auto-detect document types
- OCR for searchability

STEP 5: Maintenance History
- Last Service Date: [Calendar]
- Service Performed: [Dropdown]
- Next Service Due: [Calendar]
- Known Issues: [Text area]
```

### Method 2: SMS Professional Services
**For: High-value clients or complex vessels**

#### Field Survey Team Tools
- **Survey tablets** with structured forms
- **Industrial label printer** for QR codes
- **Professional camera** for high-quality images
- **Measurement tools** integrated with app

#### Rapid Survey Methodology
```
Pre-Visit Phase:
1. Client provides equipment list/drawings
2. SMS pre-generates QR codes
3. Survey routes planned for efficiency
4. Forms pre-populated where possible

On-Site Phase (2-3 surveyors):
- Surveyor 1: Photos & QR placement
- Surveyor 2: Data entry & verification
- Surveyor 3: Document collection
- Target: 30-40 equipment/day/team

Post-Visit Phase:
1. Data validation & cleanup
2. Drawing indexing & highlighting prep
3. Client review & approval
4. System go-live
```

### Method 3: Hybrid Approach
**For: Gradual rollout or budget-conscious clients**

1. **Phase 1**: Client does high-value equipment
2. **Phase 2**: SMS team does complex equipment
3. **Phase 3**: Ongoing additions by client
4. **Continuous**: New equipment added at installation

---

## BULK IMPORT CAPABILITIES

### Excel Import Template
```excel
| Equipment_Name | Manufacturer | Model | Serial | Location | Type | Voltage | Power |
|----------------|--------------|-------|--------|----------|------|---------|-------|
| HPU 1 Motor    | ABB          | M750  | 123456 | HPU Room | Motor| 440V    | 750kW |
```

- **Download template** with examples
- **Validation on upload** with error reporting
- **Bulk QR generation** from spreadsheet
- **Print QR sticker sheets** with location maps

### Drawing Bulk Processing
- **Folder structure** = SMS structure
  ```
  /Vessel_Name/
    /HPU_Room/
      HPU_1_Motor_Schematic.pdf
      HPU_1_Motor_Manual.pdf
    /Mud_Room/
      Mud_Pump_1_Drawings.pdf
  ```
- **Auto-categorization** from folder names
- **Batch OCR processing** for searchability
- **Smart linking** to equipment profiles

### Integration Import Options
- **CMMS Export** → SMS Import mapping
- **ERP Equipment Lists** → Automated creation
- **P&ID Drawing Parse** → Equipment extraction
- **Existing databases** → API/CSV import

---

## DATA QUALITY ENFORCEMENT

### Mandatory Fields Framework
```javascript
Equipment Profile Completeness Score:
- Basic Info (40%): Name, Make, Model, Location
- Documentation (30%): At least 1 manual/schematic  
- Photos (20%): Minimum 2 photos required
- Maintenance (10%): Last service date

Minimum 70% required for "Active" status
```

### Validation Rules
1. **Photo Quality Checks**
   - Minimum resolution: 1024x768
   - Nameplate must be readable
   - Auto-reject blurry images

2. **Data Consistency**
   - Model numbers match manufacturer database
   - Serial numbers are unique
   - Locations match vessel structure

3. **Document Requirements**
   - PDF only for consistency
   - File size limits (50MB)
   - Virus scanning on upload

---

## GAMIFICATION FOR DATA COLLECTION

### Client Staff Motivation
- **Progress bars** per area/department
- **Leaderboard** for surveyors
- **Achievements**: "Equipment Hunter", "Documentation Master"
- **Rewards**: Early access to features, training credits

### Quality Scoring
- **Gold Standard**: All fields, multiple docs, history
- **Silver Standard**: Required fields, basic docs
- **Bronze Standard**: Minimum viable data
- **Visual indicators** on dashboards

---

## EFFICIENCY TOOLS

### Smart Defaults
- **Equipment templates** by type
- **Copy similar** functionality  
- **Bulk edit** capabilities
- **Auto-fill** from manufacturer database

### Mobile Efficiency Features
- **Voice-to-text** for descriptions
- **Quick photo** with auto-crop
- **Batch QR printing** by area
- **NFC tag** support (future)

### Time Estimates
- **Self-Service**: 5-10 minutes per equipment
- **Professional**: 2-3 minutes per equipment
- **Bulk Import**: 100s of equipment in minutes

---

## ONBOARDING WORKFLOW

### Week 1: Preparation
- Client briefing call
- Choose collection method
- Provide templates/access
- Schedule survey (if needed)

### Week 2-3: Data Collection
- Daily progress monitoring
- Support hotline
- Real-time validation
- Issue resolution

### Week 4: Go-Live
- Data review with client
- Training on live system
- Handover documentation
- Success metrics setup

---

## ROI JUSTIFICATION FOR DATA COLLECTION

### Clear Value Messaging
"Every hour spent on data collection saves 10 hours in maintenance time"

### Quick Wins
1. Start with **critical equipment** first
2. Immediate value from **drawing search**
3. **QR scanning** works from day 1
4. Build momentum with **visible progress**

### Cost-Benefit Analysis Tool
```
Equipment Count: 200
Collection Time: 20 hours
Collection Cost: £2,000
Annual Downtime Savings: £50,000
ROI Period: 2 weeks
```

---

## CONTINUOUS IMPROVEMENT

### After Go-Live
- **New Equipment Workflow**: Add at installation
- **Update Triggers**: During maintenance
- **Annual Reviews**: Data quality checks
- **Automatic Enrichment**: AI suggests missing data

### Evolution Path
1. **MVP**: Manual data entry
2. **Phase 2**: IoT sensor integration
3. **Phase 3**: AI-powered data extraction
4. **Phase 4**: Automatic technical drawing generation

---

## CRITICAL SUCCESS FACTORS

1. **Make it EASY** - Simpler = Better adoption
2. **Make it FAST** - Time is money offshore
3. **Make it VALUABLE** - Show immediate benefits
4. **Make it FLEXIBLE** - Multiple input methods
5. **Make it RELIABLE** - Data validation prevents garbage

Without efficient data collection, SMS fails. With it, SMS becomes indispensable from day one.