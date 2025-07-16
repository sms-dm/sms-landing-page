# DATA FLOW ARCHITECTURE
## From Input to Database - Multiple Paths, Same Destination

### CORE PRINCIPLE
All data paths lead to the same database structure. The onboarding wizard and Excel import are just different UIs for the same data model.

---

## DATA STRUCTURE (The Truth)

### Internal Storage Format (Database)
```typescript
interface Equipment {
  // Core Fields (Required)
  id: string;                    // UUID, auto-generated
  name: string;                  // "Main Generator #1"
  area: string;                  // "Engine Room"
  type: EquipmentType;          // "generator"
  criticality: Criticality;      // "critical"
  vessel_id: string;            // Foreign key
  company_id: string;           // Foreign key
  
  // Details (Optional)
  manufacturer?: string;         // "Caterpillar"
  model?: string;               // "3516C"
  serial_number?: string;       // "ABC123"
  installation_date?: Date;     // "2015-06-15"
  
  // Specifications
  specifications?: {
    // Electrical
    voltage?: number;
    power_kw?: number;
    current_rating?: number;
    
    // Mechanical
    capacity?: number;
    pressure_rating?: number;
    flow_rate?: number;
    speed_rpm?: number;
  };
  
  // Metadata
  created_at: Date;
  created_by: string;
  updated_at: Date;
  qr_code: string;              // Auto-generated
  
  // Relationships
  photos: Photo[];
  documents: Document[];
  maintenance_schedule?: Schedule;
  fault_history: Fault[];
}
```

---

## INPUT METHODS

### Method 1: Excel Import
```
Excel → Parse → Validate → Transform → Database
         ↓
    Validation Report
```

### Method 2: Onboarding Wizard
```
Wizard → Collect → Validate → Transform → Database
          ↓
     Progress Save
```

### Method 3: API (Future)
```
External System → API → Validate → Transform → Database
                   ↓
              API Response
```

---

## DATA TRANSFORMATION PIPELINE

### Step 1: Collection
```typescript
// From Excel
const excelData = {
  "Equipment_Name": "Main Generator #1",
  "Area": "Engine Room",
  "Type": "Generator",
  "Criticality": "Critical"
};

// From Wizard
const wizardData = {
  step: "equipment-detail",
  area: "engine-room",
  equipment: {
    name: "Main Generator #1",
    type: "generator",
    criticality: "critical",
    photo: "data:image/jpeg;base64..."
  }
};
```

### Step 2: Normalization
```typescript
function normalizeData(input: any, source: 'excel' | 'wizard' | 'api') {
  return {
    name: cleanEquipmentName(input.name || input.Equipment_Name),
    area: standardizeArea(input.area || input.Area),
    type: mapEquipmentType(input.type || input.Type),
    criticality: normalizeCriticality(input.criticality || input.Criticality)
  };
}
```

### Step 3: Validation
```typescript
function validateEquipment(data: NormalizedData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!data.name) errors.push("Equipment name required");
  if (!data.area) errors.push("Area required");
  if (!data.type) errors.push("Equipment type required");
  
  // Business rules
  if (isDuplicate(data.name)) warnings.push("Possible duplicate");
  if (!isValidArea(data.area)) errors.push("Invalid area");
  
  return { 
    valid: errors.length === 0,
    errors,
    warnings 
  };
}
```

### Step 4: Storage
```typescript
async function storeEquipment(data: ValidatedData) {
  // Add system fields
  const equipment = {
    ...data,
    id: generateUUID(),
    vessel_id: currentVessel.id,
    company_id: currentCompany.id,
    created_at: new Date(),
    created_by: currentUser.id,
    qr_code: generateQRCode()
  };
  
  // Store in database
  await db.equipment.create(equipment);
  
  // If photo from wizard, store separately
  if (data.photoData) {
    await storePhoto(equipment.id, data.photoData);
  }
  
  return equipment;
}
```

---

## INTERMEDIATE FORMATS

### JSON (Preferred for Wizard)
```json
{
  "session_id": "wizard-session-123",
  "vessel_id": "vessel-456",
  "progress": {
    "areas_complete": ["engine-room", "pump-room"],
    "current_area": "drill-floor",
    "equipment_added": 25
  },
  "data": [
    {
      "name": "Main Generator #1",
      "area": "engine-room",
      "type": "generator",
      "criticality": "critical",
      "photos": ["photo-id-1", "photo-id-2"],
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Excel Export (For Records)
After wizard completion, we CAN export to Excel:
```typescript
function exportToExcel(equipmentList: Equipment[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Equipment');
  
  // Add headers
  sheet.columns = [
    { header: 'Equipment Name', key: 'name' },
    { header: 'Area', key: 'area' },
    { header: 'Type', key: 'type' },
    { header: 'Criticality', key: 'criticality' },
    { header: 'Manufacturer', key: 'manufacturer' },
    { header: 'Model', key: 'model' },
    { header: 'QR Code', key: 'qr_code' }
  ];
  
  // Add data
  equipmentList.forEach(eq => sheet.addRow(eq));
  
  return workbook.xlsx.writeBuffer();
}
```

---

## STORAGE ARCHITECTURE

### Primary Storage: PostgreSQL
```sql
-- Equipment table (main data)
CREATE TABLE equipment (
  id UUID PRIMARY KEY,
  vessel_id UUID REFERENCES vessels(id),
  name VARCHAR(255) NOT NULL,
  area VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  criticality VARCHAR(20) NOT NULL,
  specifications JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Photos table (separate for performance)
CREATE TABLE equipment_photos (
  id UUID PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id),
  filename VARCHAR(255),
  size_bytes INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### File Storage: S3/DigitalOcean Spaces
```
/companies/{company-id}/
  /vessels/{vessel-id}/
    /equipment/{equipment-id}/
      /photos/
        - overview.jpg
        - nameplate.jpg
      /documents/
        - manual.pdf
```

### Cache Layer: Redis (Future)
```javascript
// Cache frequently accessed data
cache.set(`equipment:${id}`, equipmentData, ttl: 3600);
```

---

## WHY NOT EXCEL AS INTERMEDIATE?

### Onboarding → Excel → Database ❌
- Loses photo data
- Adds complexity
- Risk of corruption
- No progress saving
- Harder validation

### Onboarding → Database ✅
- Direct storage
- Instant validation
- Progress saved
- Photos included
- Real-time sync

### But We Can Export
Users can always export their data to Excel:
- For their records
- For reporting
- For backup
- For analysis

---

## UNIFIED VALIDATION RULES

Both import methods use same rules:

```typescript
const ValidationRules = {
  name: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-#]+$/,
    unique: true
  },
  area: {
    required: true,
    allowedValues: VESSEL_AREAS
  },
  type: {
    required: true,
    allowedValues: EQUIPMENT_TYPES
  },
  criticality: {
    required: true,
    allowedValues: ['critical', 'high', 'medium', 'low']
  }
};
```

---

## BEST PRACTICE FLOW

### For New Customers:
1. **Prefer Wizard** - Better experience, photos included
2. **Excel Backup** - Export what they entered
3. **API Later** - When they have systems to integrate

### For Enterprise:
1. **Bulk Excel** - If they have clean data
2. **API Integration** - For ongoing sync
3. **Wizard for Gaps** - Fill missing areas

### Data Quality:
```
Wizard: 95% complete, with photos
Excel: 70% complete, no photos initially
API: 100% complete, if well-integrated
```

The onboarding wizard is just a better UI for the same data structure. No intermediate Excel needed!