# DATA COLLECTION FORMS
## Structured for Electrical & Mechanical Teams

### OVERVIEW
Forms designed to match our database structure exactly. No manual retyping. Focus on what electrical and mechanical teams actually need.

---

## FORM FLOW SEQUENCE

### Step 1: Company Setup (One Time)
```
Company Information:
- Company Name: ________________
- Primary Contact: ________________
- Email: ________________
- Phone: ________________

Vessel Information:
- Vessel Name: ________________
- Vessel Type: [Dropdown: Drillship/Semi-Sub/Jack-up/Platform]
- IMO Number: ________________
```

### Step 2: User Accounts
```
For each user:
- Full Name: ________________
- Email: ________________
- Role: [Dropdown: Electrician/Mechanic/Electrical Manager/Mechanical Manager]
- Default Vessel: [Dropdown from Step 1]
- Years Experience: ________________
```

### Step 3: Equipment Areas Setup
**Electrical Areas:**
- [ ] Switchgear Room
- [ ] MCC Room  
- [ ] Emergency Generator
- [ ] Main Generators
- [ ] SCR/VFD Room
- [ ] Battery Room
- [ ] Control Room
- [ ] Workshop
- [ ] Other: ________________

**Mechanical Areas:**
- [ ] Engine Room
- [ ] Pump Room
- [ ] Hydraulic Power Unit (HPU)
- [ ] Mud Pumps
- [ ] Drill Floor
- [ ] Crane Engine Room
- [ ] Compressor Room
- [ ] Workshop
- [ ] Other: ________________

---

## ELECTRICAL EQUIPMENT FORMS

### Form E1: Electrical Equipment Basic
```yaml
Equipment Identification:
  Name: ________________ (e.g., "Main Generator #1")
  Area: [Dropdown from areas above]
  Equipment Type: [Dropdown]
    - Generator
    - Motor
    - Transformer
    - Switchgear
    - MCC
    - VFD/SCR Drive
    - UPS
    - Battery Bank
    - Control Panel
    - Other: ________

Specifications:
  Manufacturer: ________________
  Model: ________________
  Serial Number: ________________
  Voltage: ________________ V
  Current Rating: ________________ A
  Power Rating: ________________ kW/kVA
  Installation Year: ________________

Criticality:
  ( ) Critical - Failure stops operations
  ( ) High - Significant impact
  ( ) Medium - Work-around available
  ( ) Low - Minimal impact
```

### Form E2: Electrical Documentation
```yaml
For each equipment:
  Operating Manual: [Upload PDF]
  Wiring Diagrams: [Upload PDF]
  Settings/Parameters: [Upload PDF/Excel]
  Test Certificates: [Upload PDF]
  Protection Settings: [Upload PDF/Excel]
  
Photos Required:
  - Front view: [Upload]
  - Nameplate: [Upload]
  - Connection points: [Upload]
  - HMI/Display: [Upload] (if applicable)
```

### Form E3: Electrical Maintenance Data
```yaml
Maintenance Schedule:
  PM Frequency: [Dropdown]
    - Weekly
    - Monthly
    - 3-Monthly
    - 6-Monthly
    - Annual
    - 2-Yearly
    
Last Maintenance:
  Date: ________________
  Type: [PM/Breakdown/Overhaul]
  Performed By: ________________
  
Common Faults:
  Fault 1: ________________
  Typical Cause: ________________
  Solution: ________________
  
Spare Parts:
  Critical Spare 1: ________________
  Part Number: ________________
  Quantity Onboard: ________________
```

---

## MECHANICAL EQUIPMENT FORMS

### Form M1: Mechanical Equipment Basic
```yaml
Equipment Identification:
  Name: ________________ (e.g., "Mud Pump #1")
  Area: [Dropdown from areas above]
  Equipment Type: [Dropdown]
    - Pump (Centrifugal)
    - Pump (Positive Displacement)
    - Compressor
    - Engine (Diesel/Gas)
    - Gearbox
    - Hydraulic System
    - Crane
    - Winch
    - Heat Exchanger
    - Valve (Control)
    - Other: ________

Specifications:
  Manufacturer: ________________
  Model: ________________
  Serial Number: ________________
  Capacity: ________________ (GPM/m³/hr)
  Pressure Rating: ________________ (PSI/Bar)
  Speed: ________________ RPM
  Installation Year: ________________

Criticality:
  ( ) Critical - Failure stops operations
  ( ) High - Significant impact  
  ( ) Medium - Work-around available
  ( ) Low - Minimal impact
```

### Form M2: Mechanical Documentation
```yaml
For each equipment:
  Operating Manual: [Upload PDF]
  P&ID Drawings: [Upload PDF]
  Assembly Drawings: [Upload PDF]
  Parts Catalog: [Upload PDF]
  Vibration Reports: [Upload PDF]
  
Photos Required:
  - Overall view: [Upload]
  - Nameplate: [Upload]
  - Coupling/Drive: [Upload]
  - Gauges/Indicators: [Upload]
```

### Form M3: Mechanical Maintenance Data
```yaml
Maintenance Schedule:
  PM Frequency: [Dropdown]
    - Daily Checks
    - Weekly
    - Monthly
    - 3-Monthly
    - 6-Monthly
    - Annual
    - Running Hours (specify): ________
    
Last Maintenance:
  Date: ________________
  Type: [PM/Breakdown/Overhaul]
  Running Hours: ________________
  
Condition Monitoring:
  Vibration Analysis: [Yes/No]
  Oil Analysis: [Yes/No]
  Thermography: [Yes/No]
  
Common Issues:
  Issue 1: ________________
  Symptoms: ________________
  Root Cause: ________________
  
Critical Spares:
  Spare 1: ________________ (e.g., Mechanical Seal)
  Part Number: ________________
  Quantity: ________________
```

---

## MANAGER-SPECIFIC FORMS

### Form MGR1: Team Information
```yaml
Electrical Team:
  Lead Electrician: ________________
  Electricians: 
    - Name: ________ Years Exp: ___
    - Name: ________ Years Exp: ___
    - Name: ________ Years Exp: ___
  
Mechanical Team:
  Lead Mechanic: ________________
  Mechanics:
    - Name: ________ Years Exp: ___
    - Name: ________ Years Exp: ___
    - Name: ________ Years Exp: ___

Certifications Tracking:
  Name: ________ Cert: ________ Expires: ________
  Name: ________ Cert: ________ Expires: ________
```

### Form MGR2: Critical Equipment List
```yaml
Top 10 Critical Equipment:
1. Name: ________ Why Critical: ________
2. Name: ________ Why Critical: ________
3. Name: ________ Why Critical: ________
(etc...)

Redundancy Map:
Equipment: ________ Backup: ________ Auto/Manual: ________
Equipment: ________ Backup: ________ Auto/Manual: ________
```

---

## EXCEL IMPORT TEMPLATE

### Sheet 1: Electrical Equipment
| Equipment_Name | Area | Type | Manufacturer | Model | Serial | Voltage | Power_kW | Critical |
|----------------|------|------|--------------|-------|--------|---------|----------|----------|
| Main Generator 1 | Engine Room | Generator | Caterpillar | 3516C | 123456 | 6600 | 2500 | Critical |
| Emergency Gen | Emergency Gen Rm | Generator | Cummins | QSK60 | 789012 | 440 | 1500 | Critical |

### Sheet 2: Mechanical Equipment  
| Equipment_Name | Area | Type | Manufacturer | Model | Serial | Capacity | Pressure | Critical |
|----------------|------|------|--------------|-------|--------|----------|----------|----------|
| Mud Pump 1 | Pump Room | Pump_PD | National Oilwell | 14-P-220 | MP001 | 1000 GPM | 7500 PSI | Critical |
| HPU | HPU Room | Hydraulic | Parker | HPU-500 | HP001 | 500 GPM | 3000 PSI | High |

### Sheet 3: Users
| Name | Email | Role | Vessel | Experience |
|------|-------|------|--------|------------|
| John Smith | j.smith@company.com | Electrician | Vessel Name | 15 |
| Mike Johnson | m.johnson@company.com | Mechanic | Vessel Name | 10 |

### Sheet 4: Maintenance Schedule
| Equipment_Name | PM_Frequency | Last_Service | Next_Due |
|----------------|--------------|--------------|----------|
| Main Generator 1 | Monthly | 2024-01-15 | 2024-02-15 |
| Mud Pump 1 | 500 Hours | 2024-01-10 | 2024-03-10 |

---

## DATA VALIDATION RULES

### Required Fields (Cannot be empty):
- Equipment Name
- Area
- Equipment Type
- Criticality

### Auto-Generated Fields:
- Equipment ID (system)
- QR Code (system)
- Created Date (system)
- Created By (system)

### Validation Rules:
```javascript
// Name validation
- No special characters except #, -, _
- Max 50 characters
- Must be unique within vessel

// Serial Number
- Alphanumeric only
- Max 30 characters

// Voltage (Electrical)
- Numeric only
- Common values: 24, 110, 220, 440, 480, 600, 3300, 6600, 11000

// Pressure (Mechanical)
- Numeric only
- Must specify units (PSI/Bar)
```

---

## IMPORT WORKFLOW

### Step 1: Download Template
User downloads our Excel template with:
- Pre-filled dropdowns
- Example data
- Validation rules
- Instructions tab

### Step 2: Fill Template
They fill what they have:
- Mandatory fields highlighted
- Drop-downs for consistency
- Auto-calculations where possible

### Step 3: Upload & Validate
System checks:
```python
def validate_import(file):
    errors = []
    warnings = []
    
    # Check required fields
    if not equipment_name:
        errors.append("Equipment name required")
    
    # Check duplicates
    if equipment_exists(equipment_name):
        warnings.append("Equipment may be duplicate")
    
    # Standardize values
    area = standardize_area(raw_area)
    type = map_equipment_type(raw_type)
    
    return errors, warnings, cleaned_data
```

### Step 4: Preview & Confirm
Show them:
- ✅ 45 equipment items ready to import
- ⚠️ 5 items need review (duplicates?)
- ❌ 3 items have errors (fix required)

### Step 5: Import to System
```python
def import_to_database(validated_data):
    for row in validated_data:
        equipment = Equipment(
            name=row['name'],
            area=row['area'],
            type=row['type'],
            vessel_id=current_vessel_id,
            company_id=current_company_id
        )
        db.save(equipment)
        generate_qr_code(equipment.id)
```

---

## PROGRESSIVE DATA COLLECTION

### Phase 1: Minimum Viable (Week 1)
Just enough to start:
- Top 20 critical equipment
- Basic info only
- One photo each
- Key users setup

### Phase 2: Operational (Month 1)
Full working system:
- All equipment (100+)
- Maintenance schedules
- Common faults documented
- Team assignments

### Phase 3: Complete (Month 2-3)
Best-in-class:
- All documentation uploaded
- Historical data imported
- Spare parts mapped
- Procedures documented

---

## SUCCESS METRICS

### Import Quality
- First-time success rate: >80%
- Data completeness: >75%
- Validation errors: <10%
- Time to import 100 items: <30 minutes

### User Adoption
- All users logged in: Week 1
- First fault reported: Day 2
- Equipment photos added: Week 2
- Handover completed: Month 1

This structured approach ensures smooth data flow from client systems into SMS without manual retyping.