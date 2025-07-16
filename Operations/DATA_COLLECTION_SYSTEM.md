# DATA COLLECTION SYSTEM
## The Foundation of SMS Success

### THE PROBLEM
Without equipment data, SMS is useless. But asking clients to enter 1000+ items manually is a non-starter. We need a professional, efficient system.

---

## DATA COLLECTION METHODS

### Method 1: Excel Import (Most Common)
**What Clients Usually Have:**
- Equipment lists in various Excel formats
- Inconsistent naming conventions
- Missing critical fields
- Multiple spreadsheets per department

**Our Import Template:**
```
SMS_Equipment_Import_Template_v1.xlsx

Required Columns:
- Equipment Name*
- Area/Location*
- Equipment Type*
- Manufacturer
- Model Number
- Serial Number
- Installation Date
- Criticality (High/Medium/Low)

Optional Columns:
- Drawing Numbers
- Manual References
- Spare Parts List
- Maintenance Interval
- Last Service Date
- Notes
```

**Import Process:**
1. Send template to client
2. They fill what they can
3. We clean and standardize
4. Import to staging
5. Client reviews in app
6. Push to production

### Method 2: On-Site Collection (Premium)
**When Used:**
- New clients wanting perfect data
- Grant money available
- Enterprise customers

**Process:**
1. 2-3 day site visit
2. Walk through each area
3. Photo every equipment
4. Scan nameplates
5. Generate QR codes on-site
6. Install QR stickers

**Deliverables:**
- Complete equipment database
- QR codes installed
- Photos organized
- Training completed

### Method 3: Phased Self-Service
**For Budget-Conscious Clients:**

**Phase 1: Critical Equipment (Week 1)**
- Top 20 equipment items
- Just enough to start
- Prove value quickly

**Phase 2: Area by Area (Month 1-2)**
- Engine room first
- Then drill floor
- Then auxiliaries
- Guided by usage

**Phase 3: Complete Coverage (Month 3-6)**
- Fill in gaps
- Add documentation
- Refine categories

---

## DATA COLLECTION FORMS

### 1. Equipment Entry Form (Mobile-First)
```typescript
interface EquipmentForm {
  // Basic Info (Required)
  name: string;
  area: Dropdown<PredefinedAreas>;
  type: Dropdown<EquipmentTypes>;
  criticality: Radio<'High' | 'Medium' | 'Low'>;
  
  // Details (Optional)
  manufacturer: Autocomplete<KnownManufacturers>;
  model: string;
  serialNumber: string;
  installDate: DatePicker;
  
  // Documentation
  photos: MultiPhotoUpload;
  manuals: FileUpload[];
  drawings: FileUpload[];
  
  // Maintenance
  maintenanceInterval: Dropdown<Intervals>;
  lastServiceDate: DatePicker;
  spareParts: TextArea;
}
```

### 2. Bulk Upload Wizard
**Step 1: Upload File**
- Drag & drop Excel/CSV
- Preview first 10 rows
- Auto-detect columns

**Step 2: Map Columns**
- Match their columns to our fields
- Flag missing required fields
- Suggest standardizations

**Step 3: Clean Data**
- Fix area names
- Standardize equipment types
- Highlight duplicates
- Show validation errors

**Step 4: Review & Import**
- Preview all data
- Fix any issues
- Import to staging
- Generate QR codes

### 3. Quick Add (During Walkthrough)
**Mobile Optimized:**
```
[Photo Button - Big]
Equipment Name: ___________
Area: [Dropdown]
Type: [Dropdown]
Critical? [Y/N]
[Save & Next]
```

- Auto-increment through areas
- Bulk operations later
- Focus on speed

---

## DOCUMENT MANAGEMENT SYSTEM

### Storage Structure
```
/companies/
  /{company-id}/
    /vessels/
      /{vessel-id}/
        /equipment/
          /{equipment-id}/
            /photos/
              - front.jpg
              - nameplate.jpg
              - installed.jpg
            /manuals/
              - manufacturer-manual.pdf
              - maintenance-guide.pdf
            /drawings/
              - P&ID-1234.pdf
              - electrical-schematic.pdf
            /certificates/
              - classification-cert.pdf
              - pressure-test.pdf
```

### File Handling Rules
**Accepted Formats:**
- Photos: JPG, PNG (auto-compress)
- Documents: PDF (preferred)
- Drawings: PDF, DWG (store only)
- Data: Excel, CSV

**Size Limits:**
- Photos: 5MB (compressed to 500KB)
- PDFs: 50MB
- Total per equipment: 500MB
- Total per vessel: 50GB

**Processing:**
1. Upload to temporary storage
2. Virus scan
3. Format validation
4. Compress if needed
5. Move to permanent storage
6. Generate thumbnails
7. Update database

### Client Access Options

#### Option 1: In-App Only (Recommended)
**Pros:**
- Full control
- Usage tracking
- Integrated search
- Access control

**Cons:**
- Must log in
- No bulk download
- Internet required

#### Option 2: Sharepoint Integration
**When Requested:**
- Enterprise clients
- Existing Sharepoint users
- Compliance requirements

**Implementation:**
```
SMS → Sharepoint Sync
- One-way sync nightly
- Folder structure matches
- Read-only in Sharepoint
- SMS remains master
```

#### Option 3: Secure Portal
**For Auditors/Inspectors:**
- Temporary access links
- View-only permissions
- Audit trail
- Auto-expire

---

## DATA QUALITY SCORING

### Equipment Completeness Score
```
Gold Standard (90-100%):
✓ All required fields
✓ Photos attached
✓ Manual uploaded
✓ Maintenance history
✓ Spare parts listed

Silver Standard (70-89%):
✓ Required fields
✓ At least one photo
✓ Some documentation

Bronze Standard (50-69%):
✓ Basic info only
✓ Functional but minimal
```

### Vessel Readiness Score
```
Ready to Launch (80%+):
- Critical equipment documented
- QR codes generated
- Key users trained
- Handover templates ready

Minimum Viable (60%):
- Top 20 equipment items
- Basic categories set
- Admin user trained

Not Ready (<60%):
- Need more data
- Schedule collection
- Delay launch
```

---

## COLLECTION WORKFLOWS

### New Customer Onboarding

**Day 1: Discovery Call**
```
Questions to Ask:
1. "Do you have equipment lists in Excel?"
2. "How many pieces of equipment roughly?"
3. "Are drawings digitized?"
4. "Who maintains this data currently?"
5. "What's your go-live timeline?"
```

**Day 2-3: Data Review**
```
We receive their files:
- Usually 5-10 Excel sheets
- Often inconsistent
- Missing 30% of fields
- No standardization
```

**Day 4-5: Processing**
```
Our cleanup process:
1. Merge all Excel files
2. Standardize naming:
   - "Pump 1" → "Mud Pump #1"
   - "HPU" → "Hydraulic Power Unit"
3. Assign areas:
   - Match to our standard areas
   - Create custom if needed
4. Fill obvious gaps:
   - Equipment type from name
   - Criticality from type
```

**Day 6-7: Import & Review**
```
Import workflow:
1. Load to staging environment
2. Generate preview link
3. Client review call
4. Fix any issues
5. Generate QR codes
6. Go live!
```

### Ongoing Data Improvement

**Month 1: Active Use**
- Users add photos during work
- Maintenance history builds
- Documents uploaded ad-hoc
- Gaps identified

**Month 2-3: Refinement**
- Standardize naming further
- Add missing equipment
- Improve categorization
- Upload more manuals

**Month 6: Audit**
- Full data quality review
- Completeness report
- Improvement plan
- Consider on-site visit

---

## TOOLS WE NEED TO BUILD

### 1. Import Wizard
- [ ] Excel parser
- [ ] Column mapping UI
- [ ] Data validation
- [ ] Duplicate detection
- [ ] Staging preview
- [ ] Bulk operations

### 2. Collection Mobile App
- [ ] Quick photo capture
- [ ] Offline capability
- [ ] Barcode scanning
- [ ] Voice notes
- [ ] GPS location
- [ ] Batch upload

### 3. QR Code System
- [ ] Bulk generation
- [ ] Print layouts (Avery templates)
- [ ] Tracking activation
- [ ] Replacement process
- [ ] Weather-resistant options

### 4. Progress Dashboard
- [ ] Completion by area
- [ ] Quality scores
- [ ] Missing data alerts
- [ ] Weekly progress email
- [ ] Gamification elements

---

## PRICING MODEL FOR DATA SERVICES

### Option 1: Included Free
**For First 10 Customers:**
- We do everything
- Learn and improve
- Build testimonials
- Perfect the process

### Option 2: Professional Service
**After Proven Process:**

**Remote Data Service: £2,500**
- Process existing files
- 2 weeks turnaround
- Clean and import
- Training included

**On-Site Service: £5,000-10,000**
- 2-3 day visit
- Complete documentation
- QR codes installed
- Team training
- Quality guarantee

**Maintenance Service: £500/month**
- Ongoing data quality
- Monthly audits
- New equipment adds
- Documentation updates

---

## SUCCESS METRICS

### Data Quality KPIs
- Equipment with photos: >80%
- Critical equipment documented: 100%
- Average completeness score: >75%
- Time to import 100 items: <2 hours

### Customer Success KPIs
- Time to first value: <7 days
- Data collection NPS: >8
- Self-service adoption: >50%
- Support tickets on data: <10%

---

## NEXT STEPS

### Immediate (This Week)
1. [ ] Create Excel import template
2. [ ] Design equipment form UI
3. [ ] Build basic import parser
4. [ ] Test with sample data

### Short Term (Month 1)
1. [ ] Complete import wizard
2. [ ] QR code generator
3. [ ] Progress tracking
4. [ ] Mobile optimization

### Medium Term (Month 2-3)
1. [ ] Advanced validation
2. [ ] Bulk operations
3. [ ] API for integrations
4. [ ] Customer self-service

Without this data system, nothing else matters. This needs to be our first priority after basic infrastructure.