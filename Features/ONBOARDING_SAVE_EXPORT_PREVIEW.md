# ONBOARDING WIZARD: SAVE, EXPORT & PREVIEW FEATURES

## 1. AUTO-SAVE SYSTEM

### Save Strategy: Every Action
```typescript
// Save triggers
const AUTO_SAVE_TRIGGERS = {
  photoTaken: true,          // Instant save after photo
  equipmentAdded: true,      // After each equipment
  areaCompleted: true,       // After finishing area
  fieldChanged: true,        // After 3 seconds of no typing
  pageNavigation: true,      // Before moving screens
  appBackground: true        // When switching apps
};
```

### Progressive Save Implementation
```typescript
interface OnboardingSession {
  id: string;
  vessel_id: string;
  started_at: Date;
  last_saved: Date;
  status: 'in_progress' | 'complete' | 'abandoned';
  
  progress: {
    current_step: string;
    current_area: string;
    completed_areas: string[];
    total_equipment: number;
    photos_taken: number;
  };
  
  data: {
    areas: Area[];
    equipment: Equipment[];
    pending_uploads: Photo[];
  };
}

// Auto-save function
async function autoSave(session: OnboardingSession) {
  try {
    // Save to local storage first (instant)
    localStorage.setItem(`onboarding_${session.id}`, JSON.stringify(session));
    
    // Then sync to server (background)
    await api.post('/onboarding/save', {
      session_id: session.id,
      data: session.data,
      progress: session.progress
    });
    
    // Update UI indicator
    showSaveIndicator('Saved');
    
  } catch (error) {
    // Keep local copy if server fails
    showSaveIndicator('Saved locally - will sync when online');
  }
}
```

### Resume Capability
```
Welcome back! 

You were adding equipment in the Engine Room.
You've added 15 equipment items so far.

[Continue Where You Left Off]
[Start Over]
[View Progress]
```

### Visual Save Indicators
```
Top of screen shows:
💾 Saving...          (when saving)
✅ Saved 2 seconds ago (after save)
⚠️ Offline - will sync (when no connection)
❌ Save failed - retrying (on error)
```

---

## 2. EXCEL EXPORT FEATURE

### Export Options Screen
```
Great job! Your equipment data is ready.

Export Options:
┌─────────────────────────────────┐
│ 📊 Export to Excel              │
│                                 │
│ ☑️ Equipment List               │
│ ☑️ Maintenance Schedules        │
│ ☑️ Photo References             │
│ ☐ Include blank templates      │
│                                 │
│ [Download Excel File]           │
└─────────────────────────────────┘

Or continue to document upload →
```

### Export Format
```typescript
async function exportToExcel(session: OnboardingSession) {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Equipment List
  const equipmentSheet = workbook.addWorksheet('Equipment');
  equipmentSheet.columns = [
    { header: 'Equipment Name', key: 'name', width: 30 },
    { header: 'Area', key: 'area', width: 20 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Criticality', key: 'criticality', width: 15 },
    { header: 'Manufacturer', key: 'manufacturer', width: 20 },
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Serial Number', key: 'serial', width: 20 },
    { header: 'QR Code', key: 'qr_code', width: 15 },
    { header: 'Photos', key: 'photo_count', width: 10 }
  ];
  
  // Sheet 2: Area Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Area', 'Equipment Count', 'Photos', 'Completion']);
  
  // Sheet 3: Photo Register
  const photoSheet = workbook.addWorksheet('Photos');
  photoSheet.columns = [
    { header: 'Equipment', key: 'equipment', width: 30 },
    { header: 'Photo Type', key: 'type', width: 20 },
    { header: 'Filename', key: 'filename', width: 40 },
    { header: 'Date Taken', key: 'date', width: 20 }
  ];
  
  // Add data from session
  session.data.equipment.forEach(eq => {
    equipmentSheet.addRow({
      name: eq.name,
      area: eq.area,
      type: eq.type,
      criticality: eq.criticality,
      manufacturer: eq.manufacturer || '',
      model: eq.model || '',
      serial: eq.serial_number || '',
      qr_code: eq.qr_code,
      photo_count: eq.photos.length
    });
  });
  
  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, `SMS_Equipment_${vessel.name}_${date}.xlsx`);
}
```

### Export Includes:
1. **Complete equipment list** - All fields populated
2. **Photo register** - References to all photos taken
3. **Area summary** - Stats and completion
4. **QR codes** - Ready to print
5. **Templates** - For any missing equipment

---

## 3. PREVIEW & REVIEW SYSTEM

### Pre-Submission Review
```
Review Your Data Before Submitting

Summary:
✅ 5 Areas documented
✅ 47 Equipment items added
✅ 38 Photos taken
⚠️ 9 Equipment missing photos
⚠️ 2 Possible duplicates

[Review Details] [Fix Issues] [Submit Anyway]
```

### Detailed Preview Interface
```typescript
interface PreviewScreen {
  // Tab 1: By Area
  areaView: {
    "Engine Room": {
      equipment_count: 12,
      photos: 10,
      warnings: ["Missing photo: Fuel Purifier"],
      completeness: 85
    }
  };
  
  // Tab 2: By Equipment Type
  typeView: {
    "Generators": 4,
    "Pumps": 15,
    "Motors": 22
  };
  
  // Tab 3: Issues to Review
  issues: [
    {
      type: "duplicate",
      message: "Main Generator #1 appears twice",
      action: "Merge | Keep Both | Delete One"
    },
    {
      type: "missing_critical",
      message: "No Emergency Generator found",
      action: "Add Now | Skip"
    }
  ];
}
```

### Visual Preview
```
┌─── Equipment Preview ─────────────────┐
│ Engine Room (12 items)                │
│ ├── 🟢 Main Generator #1 ✓📷✓📄      │
│ ├── 🟢 Emergency Generator ✓📷✓📄     │
│ ├── 🟡 Fuel Purifier ✓📷⚠️          │
│ └── 🟢 Main Engine ✓📷✓📄            │
│                                       │
│ Legend:                               │
│ 🟢 Complete 🟡 Missing info 🔴 Critical│
│ 📷 Has photo 📄 Has details          │
└───────────────────────────────────────┘

[Edit] [Approve This Area]
```

### Final Confirmation
```
Ready to Submit?

This will:
✓ Create 47 equipment records
✓ Generate QR codes
✓ Set up folder structure
✓ Enable fault reporting

You can always:
- Add more equipment later
- Upload documents anytime
- Edit any information

[← Back to Preview] [Submit & Finish →]
```

---

## AUTO-SAVE TECHNICAL DETAILS

### Local Storage Structure
```javascript
// Immediate save (works offline)
localStorage.setItem('onboarding_session', JSON.stringify({
  version: 1,
  session_id: 'uuid-here',
  vessel_id: 'vessel-uuid',
  last_saved: new Date().toISOString(),
  data: compressedData
}));

// Photo queue (for offline)
localStorage.setItem('photo_queue', JSON.stringify([
  {
    equipment_id: 'temp-id-1',
    photo_data: 'base64...',
    timestamp: '2024-01-15T10:30:00Z',
    uploaded: false
  }
]));
```

### Server Sync Strategy
```typescript
// Every 30 seconds if changes
const syncInterval = setInterval(async () => {
  if (hasUnsavedChanges()) {
    await syncWithServer();
  }
}, 30000);

// On significant events
const syncTriggers = {
  onAreaComplete: () => syncWithServer(),
  onEquipmentAdd: () => debounce(syncWithServer, 5000),
  onPhotoTake: () => syncWithServer(),
  onAppResume: () => syncWithServer()
};
```

### Conflict Resolution
```typescript
// If device A and device B both edit
function resolveConflicts(local: Data, server: Data) {
  // Last write wins for most fields
  // Photos are additive (merge all)
  // Equipment names must be unique
  
  return {
    equipment: mergeByTimestamp(local.equipment, server.equipment),
    photos: [...local.photos, ...server.photos],
    lastModified: Math.max(local.timestamp, server.timestamp)
  };
}
```

---

## USER BENEFITS

### Auto-Save Benefits:
- **Never lose work** - Even if app crashes
- **Switch devices** - Continue on desktop
- **Multiple people** - Can collaborate
- **Peace of mind** - See save status

### Export Benefits:
- **Backup copy** - They own their data
- **Share with team** - Via email/SharePoint
- **Import elsewhere** - Standard format
- **Compliance** - Audit trail

### Preview Benefits:
- **Catch errors** - Before they're in system
- **Completeness** - See what's missing
- **Confidence** - Know what will happen
- **Quality** - Fix issues before submit

This makes the onboarding bulletproof and professional!