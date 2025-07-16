# Floating Equipment Functionality

## Overview

The floating equipment functionality allows equipment to be transferred between vessels while preserving all historical data, documents, parts information, and quality scores. This feature is essential for managing equipment that moves between vessels, such as portable generators, specialized tools, or rental equipment.

## Equipment Classifications

### 1. **Permanent** (Default)
- Fixed equipment that stays with the vessel
- Cannot be transferred
- Examples: Main engines, fixed pumps, navigation systems

### 2. **Floating**
- Equipment that can be transferred between vessels
- Preserves all data during transfers
- Examples: Portable generators, specialized testing equipment

### 3. **Rental**
- Rented equipment that may be returned or moved
- Can be transferred between vessels
- Examples: Temporary compressors, leased equipment

## Database Schema Changes

### New Enum: `EquipmentClassification`
```sql
enum EquipmentClassification {
  PERMANENT
  FLOATING
  RENTAL
}
```

### Equipment Table Updates
- Added `classification` field with default value `PERMANENT`
- Added index on `classification` for efficient filtering

### New Table: `equipment_transfers`
Stores complete transfer history with data snapshots:
- `equipment_id`: Reference to the equipment
- `from_vessel_id` / `to_vessel_id`: Source and destination vessels
- `from_location_id` / `to_location_id`: Optional location details
- `transferred_by`: User who performed the transfer
- `transferred_at`: Timestamp of transfer
- `reason`: Required reason for transfer
- `notes`: Optional additional notes
- `document_data`: JSON snapshot of documents at transfer time
- `parts_data`: JSON snapshot of parts at transfer time
- `quality_scores_data`: JSON snapshot of quality scores

## API Endpoints

### Transfer Equipment
```
POST /api/equipment/:equipmentId/transfer
```

**Request Body:**
```json
{
  "toVesselId": "uuid",
  "toLocationId": "uuid (optional)",
  "reason": "string",
  "notes": "string (optional)"
}
```

**Validations:**
- Only `FLOATING` or `RENTAL` equipment can be transferred
- Destination vessel must exist
- Reason is required
- User must have ADMIN or MANAGER role

**Response:**
```json
{
  "data": {
    "equipment": { /* updated equipment */ },
    "transfer": { /* transfer record */ }
  },
  "message": "Equipment transferred successfully"
}
```

### Get Transfer History
```
GET /api/equipment/:equipmentId/transfers
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "data": [/* transfer records */],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 45
  }
}
```

## Frontend Components

### 1. **Equipment Form Enhancement**
- Added classification selection when creating equipment
- Visual indicators for each classification type
- Help text explaining classification options

### 2. **Equipment Transfer Modal**
- Select destination vessel
- Optional location selection
- Required reason field
- Optional notes
- Shows current equipment details
- Validates classification before allowing transfer

### 3. **Equipment Review Page**
- Filter by classification
- Transfer button for floating/rental equipment
- Visual classification indicators
- Transfer history tab

### 4. **Transfer History Component**
- Timeline view of all transfers
- Shows from/to vessels and locations
- Transfer reason and notes
- User who performed transfer
- Data preservation indicators

## Data Preservation

During transfers, the following data is preserved:

1. **Complete History**
   - All previous transfers
   - Creation and modification dates
   - User actions and approvals

2. **Documents**
   - All uploaded documents remain linked
   - Document snapshots stored in transfer record

3. **Parts Information**
   - Critical parts associations
   - Parts inventory data
   - Supplier information

4. **Quality Scores**
   - All quality assessments
   - Verification history
   - Review notes

## Audit Trail

All transfers create comprehensive audit logs:
- Old and new vessel/location values
- Transfer reason and notes
- User performing the transfer
- Timestamp and metadata

## Notifications

Transfer actions trigger notifications to:
- Vessel managers of both source and destination vessels
- System administrators
- Relevant stakeholders based on equipment criticality

## Security Considerations

- Only users with ADMIN or MANAGER roles can transfer equipment
- Transfers are logged in the audit trail
- Cannot transfer PERMANENT equipment
- All transfers require a reason
- Data snapshots prevent data loss

## Usage Examples

### Creating Floating Equipment
```javascript
const equipment = {
  name: "Portable Generator",
  classification: EquipmentClassification.FLOATING,
  // ... other fields
};
```

### Transferring Equipment
```javascript
await managerApi.transferEquipment(equipmentId, {
  toVesselId: "destination-vessel-id",
  toLocationId: "engine-room-id", // optional
  reason: "Vessel A going to dry dock, equipment needed on Vessel B",
  notes: "Generator in excellent condition, last serviced 2 weeks ago"
});
```

### Viewing Transfer History
```javascript
const transfers = await managerApi.getEquipmentTransferHistory(equipmentId);
// Returns paginated list of all transfers for the equipment
```

## Best Practices

1. **Classification Guidelines**
   - Default to PERMANENT for fixed installations
   - Use FLOATING for company-owned portable equipment
   - Use RENTAL for leased or temporary equipment

2. **Transfer Reasons**
   - Be specific about why equipment is being moved
   - Include relevant operational context
   - Document any special handling requirements

3. **Data Quality**
   - Ensure equipment is properly documented before transfers
   - Review and update equipment condition if needed
   - Verify all parts and documents are current

## Migration Notes

Existing equipment will default to PERMANENT classification. To enable transfers:
1. Update equipment classification to FLOATING or RENTAL
2. Verify all associated data is complete
3. Test transfer functionality in staging environment