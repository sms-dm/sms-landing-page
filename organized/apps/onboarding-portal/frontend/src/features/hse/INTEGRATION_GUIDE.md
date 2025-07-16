# HSE Module Integration Guide

## Overview
The HSE (Health, Safety & Environment) module provides comprehensive safety management features for vessel operations. This guide explains how to integrate the HSE components into your existing SMS application.

## Quick Start

### 1. Add HSE Dashboard Widget to Vessel Pages
```tsx
import { HSEDashboardWidget } from '@/features/hse';

// In your vessel detail page:
<HSEDashboardWidget vesselId={vesselId} compact={true} />
```

### 2. Navigate to HSE Onboarding
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to HSE onboarding for a vessel
navigate(`/hse/vessels/${vesselId}/onboarding`);
```

### 3. Check User Permissions
```tsx
import { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const { user } = useAuth();

const canAccessHSE = user && [
  UserRole.HSE_OFFICER,
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN
].includes(user.role);
```

## API Endpoints

### HSE Routes
- `GET /api/v1/hse/vessels/:vesselId/onboarding` - Get HSE data
- `PUT /api/v1/hse/vessels/:vesselId/onboarding` - Update HSE data
- `POST /api/v1/hse/vessels/:vesselId/certificates` - Add certificate
- `PUT /api/v1/hse/certificates/:certificateId` - Update certificate
- `DELETE /api/v1/hse/certificates/:certificateId` - Delete certificate
- `POST /api/v1/hse/vessels/:vesselId/emergency-contacts` - Add contact
- `PUT /api/v1/hse/emergency-contacts/:contactId` - Update contact
- `DELETE /api/v1/hse/emergency-contacts/:contactId` - Delete contact
- `GET /api/v1/hse/dashboard` - Get dashboard data

## Components

### Main Components
1. **HSEOnboardingPage** - Full HSE management page with tabs
2. **HSEDashboardWidget** - Compact dashboard for integration
3. **SafetyEquipmentSection** - Safety equipment checklist
4. **CertificatesSection** - Certificate management
5. **EmergencyContactsSection** - Emergency contacts
6. **SafetyStatusSection** - Current safety status

### Usage Examples

#### Add HSE Menu Item
```tsx
// In your navigation menu
{canAccessHSE && (
  <MenuItem
    icon={<ShieldIcon />}
    label="HSE Management"
    onClick={() => navigate(`/hse/vessels/${vesselId}/onboarding`)}
  />
)}
```

#### Show HSE Status in Vessel List
```tsx
// In vessel list table
<td>
  {vessel.hseStatus && (
    <Badge variant={vessel.hseStatus.overallRiskLevel}>
      {vessel.hseStatus.overallRiskLevel} Risk
    </Badge>
  )}
</td>
```

## Data Integration

### Update Vessel Schema (if needed)
```typescript
interface Vessel {
  // ... existing fields
  hseOnboardingId?: string;
  hseStatus?: {
    certificatesValid: boolean;
    safetyEquipmentComplete: boolean;
    overallRiskLevel: 'low' | 'medium' | 'high';
  };
}
```

### Add HSE Role to User Management
The `HSE_OFFICER` role has been added to the UserRole enum. Update your user management UI to include this role option.

## Security Considerations

1. **Role-Based Access**: Only users with HSE_OFFICER, MANAGER, ADMIN, or SUPER_ADMIN roles can access HSE features
2. **Edit Permissions**: Only HSE_OFFICER, ADMIN, and SUPER_ADMIN can edit HSE data
3. **File Uploads**: Certificate uploads are validated and restricted to PDF format

## Customization

### Theme Integration
The HSE components use the existing UI components and follow your application's theme automatically.

### Custom Fields
To add custom safety equipment items:
```tsx
// In SafetyEquipmentSection, add to equipmentItems array:
{ key: 'customEquipment', label: 'Custom Equipment', icon: '🔧' }
```

### Certificate Types
To add custom certificate types, update the CertificateType enum in your types file.

## Testing

### Mock Data
The current implementation includes mock data for testing. Replace with actual database queries in production.

### Test Scenarios
1. Create test vessel with HSE data
2. Test certificate upload/download
3. Verify role-based access control
4. Test offline functionality (if implemented)

## Future Enhancements

1. **Notifications**: Alert users about expiring certificates
2. **Reports**: Generate HSE compliance reports
3. **Mobile App**: Offline-capable mobile interface
4. **Integration**: Connect with external HSE systems
5. **Analytics**: HSE performance dashboards