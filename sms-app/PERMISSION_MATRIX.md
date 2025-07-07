# Team Communication Permission Matrix

## Overview
This document outlines the permission system for the SMS team communication features, defining who can post where and what actions each role can perform.

## User Roles

### 1. **Technician**
- **Department**: Electrical or Mechanical
- **Vessel**: Assigned to specific vessel

### 2. **Electrical Manager**
- **Department**: Electrical
- **Vessel**: May oversee multiple vessels

### 3. **Mechanical Manager**
- **Department**: Mechanical
- **Vessel**: May oversee multiple vessels

### 4. **HSE Officer**
- **Department**: HSE
- **Vessel**: Assigned to specific vessel

### 5. **HSE Manager**
- **Department**: HSE
- **Vessel**: Fleet-wide oversight

### 6. **Manager** (General)
- **Department**: Management
- **Vessel**: Vessel or fleet oversight

### 7. **Admin**
- **Department**: Any
- **Vessel**: Fleet-wide access

## Channel Types

1. **Department Channels** - For specific departments (electrical/mechanical)
2. **Management Channels** - For managers only
3. **Vessel Channels** - For all crew on a specific vessel
4. **HSE Channels** - For HSE updates and safety communications
5. **Direct Messages** - Private 1-on-1 or group messages
6. **Announcement Channels** - For official announcements

## Permission Matrix

### Channel Posting Permissions

| Role | Department Channel | Management Channel | Vessel Channel | HSE Channel | Direct Message | Announcement |
|------|-------------------|-------------------|----------------|-------------|----------------|--------------|
| **Technician** | ✅ Own dept only | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Electrical Manager** | ✅ Electrical | ✅ | ✅ Own vessel | ❌ | ✅ | ❌ |
| **Mechanical Manager** | ✅ Mechanical | ✅ | ✅ Own vessel | ❌ | ✅ | ❌ |
| **HSE Officer** | ❌ | ❌ | ❌ | ✅ Vessel HSE | ✅ | ❌ |
| **HSE Manager** | ❌ | ✅ | ✅ | ✅ All HSE | ✅ | ✅ |
| **Manager** | ❌ | ✅ | ✅ Own vessel | ❌ | ✅ | ✅ |
| **Admin** | ✅ All | ✅ | ✅ All | ✅ All | ✅ | ✅ |

### Channel Reading Permissions

| Role | Department Channel | Management Channel | Vessel Channel | HSE Channel | Direct Message | Announcement |
|------|-------------------|-------------------|----------------|-------------|----------------|--------------|
| **Technician** | ✅ Own dept | ❌ | ✅ Own vessel | ✅ | ✅ If member | ✅ |
| **Electrical Manager** | ✅ All | ✅ | ✅ All | ✅ | ✅ If member | ✅ |
| **Mechanical Manager** | ✅ All | ✅ | ✅ All | ✅ | ✅ If member | ✅ |
| **HSE Officer** | ✅ Own vessel | ❌ | ✅ Own vessel | ✅ | ✅ If member | ✅ |
| **HSE Manager** | ✅ All | ✅ | ✅ All | ✅ | ✅ If member | ✅ |
| **Manager** | ✅ All | ✅ | ✅ All | ✅ | ✅ If member | ✅ |
| **Admin** | ✅ All | ✅ | ✅ All | ✅ | ✅ All | ✅ |

### HSE Update Permissions

| Role | Create Fleet-wide | Create Vessel-specific | Create Department | Acknowledge | View Stats |
|------|------------------|----------------------|-------------------|-------------|------------|
| **Technician** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Electrical Manager** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Mechanical Manager** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **HSE Officer** | ❌ | ✅ Own vessel | ❌ | ✅ | ✅ |
| **HSE Manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

### Channel Management Permissions

| Role | Create Channels | Moderate Channels | Delete Messages | Edit Own Messages |
|------|----------------|------------------|-----------------|-------------------|
| **Technician** | ❌ | ❌ | ❌ | ✅ |
| **Electrical Manager** | ✅ Dept/Team | ✅ Electrical | ✅ In moderated | ✅ |
| **Mechanical Manager** | ✅ Dept/Team | ✅ Mechanical | ✅ In moderated | ✅ |
| **HSE Officer** | ❌ | ❌ | ❌ | ✅ |
| **HSE Manager** | ✅ HSE | ✅ HSE | ✅ In HSE | ✅ |
| **Manager** | ✅ Vessel/Ann. | ✅ Managed | ✅ In moderated | ✅ |
| **Admin** | ✅ All | ✅ All | ✅ All | ✅ |

## Key Rules

### For Technicians
1. **Can ONLY post in their department channel** (electrical OR mechanical)
2. Cannot post in management, vessel-wide, or HSE channels
3. Can read and acknowledge HSE updates
4. Can participate in direct messages

### For Department Managers (Electrical/Mechanical)
1. Can post in their team channels
2. Can post in management channels
3. Can moderate their department channels
4. Have full visibility across the system

### For HSE Personnel
1. **HSE Managers**: Can create fleet-wide HSE updates
2. **HSE Officers**: Can only create vessel-specific HSE updates
3. Both can post in HSE channels
4. All users can acknowledge HSE updates

### Message Editing/Deletion
1. Users can edit/delete their own messages
2. Channel moderators can delete messages in their channels
3. Admins can edit/delete any message

## Implementation Notes

### Frontend (React/TypeScript)
- Use `utils/permissions.ts` to check permissions before showing UI elements
- Hide "Post" button in channels where user cannot post
- Show permission tooltips to explain why actions are disabled
- Filter channel list based on read permissions

### Backend (Node.js/Express)
- Use `permissions.middleware.ts` to enforce all permission checks
- Return 403 Forbidden for unauthorized actions
- Log permission violations for security monitoring
- Validate vessel/department assignments on every request

### Database Considerations
- User table must include: role, department, default_vessel_id
- Channel table must include: channel_type, department, vessel_id
- HSE updates must include: scope, vessel_id, department
- Maintain audit log of permission-related actions

## Security Best Practices

1. **Never trust client-side permission checks** - Always validate on backend
2. **Use middleware consistently** - Apply permission checks to all relevant routes
3. **Fail securely** - Default to denying access if permissions unclear
4. **Audit sensitive actions** - Log who creates HSE updates, deletes messages, etc.
5. **Regular permission reviews** - Audit user roles quarterly

## Testing Checklist

### Technician Tests
- [ ] Can post ONLY in their department channel
- [ ] Cannot post in other channels
- [ ] Can read vessel and department channels
- [ ] Can acknowledge HSE updates

### Manager Tests
- [ ] Can post in department and management channels
- [ ] Can moderate their department channels
- [ ] Cannot create HSE updates
- [ ] Can view all channels

### HSE Tests
- [ ] HSE Manager can create fleet-wide updates
- [ ] HSE Officer can only create vessel-specific updates
- [ ] HSE Officer cannot create fleet-wide updates
- [ ] Both can post in HSE channels

### Edge Cases
- [ ] User with no department cannot post in department channels
- [ ] User with no vessel assignment handled gracefully
- [ ] Channel with no department/vessel allows appropriate access
- [ ] Deleted user's messages remain but cannot be edited