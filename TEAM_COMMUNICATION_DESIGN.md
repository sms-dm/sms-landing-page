# SMS Team Communication System Design

## Overview

This document outlines the team-based communication system for SMS, enabling effective communication between managers and their teams, cross-vessel HSE updates, and department-specific channels.

## Team Structure

### Hierarchy
```
Company
└── Vessels
    └── Departments
        ├── Electrical (Manager + Electricians)
        ├── Mechanical (Manager + Mechanics)
        └── HSE (Shore Manager + Vessel Officers)
```

### Team Assignment During Onboarding

When creating users in the onboarding portal:

1. **Select Role**: Manager, Technician, HSE Officer
2. **Assign Department**: Electrical, Mechanical, HSE, General
3. **Assign Manager**: For technicians, select their direct manager
4. **Vessel Assignment**: Current vessel (can be transferred later)

## Communication Channels

### 1. Team Channels
Each vessel has department-specific channels:
- `electrical-team-{vesselId}`
- `mechanical-team-{vesselId}`
- `hse-updates-{vesselId}`

### 2. Fleet-Wide Channels
- `hse-fleet-updates` - HSE Managers post company-wide safety updates
- `electrical-managers` - All electrical managers across fleet
- `mechanical-managers` - All mechanical managers across fleet

### 3. Direct Messaging
- Manager ↔ Team member private chats
- Critical fault support chats (auto-created when critical fault logged)

## HSE Communication Board

### Two-Tier System

#### Tier 1: Fleet-Wide HSE Updates
**Who can post**: HSE Managers (shore-based)
**Visibility**: All vessels, all crew
**Content**:
- Safety bulletins
- Regulatory updates
- Best practices
- Incident learnings
- Monthly safety themes

#### Tier 2: Vessel-Specific HSE Updates
**Who can post**: Vessel HSE Officers
**Visibility**: Crew on that vessel
**Content**:
- Daily safety observations
- Toolbox talk summaries
- Local hazards
- Near-miss reports
- Safety achievements

### HSE Board Features
- **Priority Levels**: Critical, Important, Informational
- **Acknowledgment Required**: Track who has read critical updates
- **Pin Important Messages**: Keep safety alerts visible
- **Expiry Dates**: Auto-archive old updates
- **Rich Media**: Support images, PDFs, videos

## Implementation Components

### Database Schema
```sql
-- Team assignments
ALTER TABLE users ADD COLUMN department VARCHAR(50);
ALTER TABLE users ADD COLUMN manager_id UUID REFERENCES users(id);

-- Communication channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- team, fleet, direct, hse_board
  vessel_id UUID REFERENCES vessels(id),
  department VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel members
CREATE TABLE channel_members (
  channel_id UUID REFERENCES channels(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member', -- admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  type VARCHAR(50) DEFAULT 'text', -- text, file, safety_bulletin
  priority VARCHAR(50), -- critical, important, informational
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Read receipts
CREATE TABLE message_reads (
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (message_id, user_id)
);

-- HSE updates specific table
CREATE TABLE hse_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  scope VARCHAR(50) NOT NULL, -- fleet, vessel
  vessel_id UUID REFERENCES vessels(id),
  category VARCHAR(100), -- safety_bulletin, regulation, near_miss, etc.
  expires_at TIMESTAMPTZ,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend Components

#### 1. Team Chat Component
```typescript
// Location: /src/components/communication/TeamChat.tsx
interface TeamChatProps {
  channelId: string;
  currentUser: User;
  teamMembers: User[];
}
```

#### 2. HSE Board Component
```typescript
// Location: /src/components/hse/HSEBoard.tsx
interface HSEBoardProps {
  vesselId?: string; // Optional for fleet-wide view
  userRole: UserRole;
  canPost: boolean;
}
```

#### 3. Chat Widget (for dashboards)
```typescript
// Location: /src/components/communication/ChatWidget.tsx
// Floating chat widget that can be minimized
// Shows unread message count
// Quick access to team channels
```

### API Endpoints

#### Channel Management
- `GET /api/channels` - List user's channels
- `POST /api/channels` - Create new channel
- `GET /api/channels/:id/members` - Get channel members
- `POST /api/channels/:id/members` - Add member to channel

#### Messaging
- `GET /api/channels/:id/messages` - Get message history
- `POST /api/channels/:id/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/read` - Mark as read
- `POST /api/messages/:id/acknowledge` - Acknowledge critical message

#### HSE Specific
- `GET /api/hse/updates` - Get HSE updates (filtered by scope)
- `POST /api/hse/updates` - Post HSE update
- `GET /api/hse/updates/:id/acknowledgments` - Track who acknowledged

### WebSocket Events

```javascript
// Join channels on connection
socket.on('authenticate', (token) => {
  // Join user's channels
  const channels = getUserChannels(userId);
  channels.forEach(channel => {
    socket.join(`channel:${channel.id}`);
  });
});

// Message events
socket.on('message:send', (data) => {
  // Broadcast to channel members
  io.to(`channel:${data.channelId}`).emit('message:new', message);
});

// Typing indicators
socket.on('typing:start', (channelId) => {
  socket.to(`channel:${channelId}`).emit('typing:user', userId);
});

// HSE alerts
socket.on('hse:critical', (update) => {
  // Broadcast to all relevant users
  io.emit('hse:alert', update);
});
```

## User Experience

### For Managers
1. **Team Overview**: See all team members and their status
2. **Quick Messages**: Send announcements to entire team
3. **Direct Support**: Jump into critical fault chats
4. **Cross-Fleet Communication**: Coordinate with other managers

### For Technicians
1. **Team Chat**: Ask questions, share knowledge
2. **Manager Access**: Direct line to supervisor
3. **HSE Updates**: Stay informed on safety
4. **Fault Support**: Get help during critical issues

### For HSE Officers
1. **Vessel Updates**: Post daily safety observations
2. **Fleet Bulletins**: Receive and acknowledge company-wide updates
3. **Incident Reporting**: Share learnings quickly
4. **Compliance Tracking**: See who has read critical updates

## Security & Privacy

- **Role-Based Access**: Users only see channels they're members of
- **Message Retention**: Configurable per channel type
- **Audit Trail**: All messages logged for compliance
- **Data Encryption**: Messages encrypted at rest
- **No External Access**: All communication stays within company

## Mobile Considerations

- **Offline Queue**: Messages sent while offline sync when connected
- **Push Notifications**: Critical HSE updates and @mentions
- **Reduced Data Mode**: Text-only option for satellite connections
- **Quick Actions**: Pre-defined responses for common situations

## Integration Points

1. **Fault System**: Auto-create support chat for critical faults
2. **Onboarding**: Set up team assignments during user creation
3. **Notifications**: Email digest of missed messages
4. **Analytics**: Communication metrics in manager dashboards

## Success Metrics

- Message delivery rate
- Read/acknowledgment rates for HSE updates
- Average response time for critical fault chats
- Team engagement (messages per user)
- Safety improvement correlation

## Implementation Priority

1. **Phase 1**: Basic team channels and messaging
2. **Phase 2**: HSE board with acknowledgments
3. **Phase 3**: Critical fault support chats
4. **Phase 4**: Advanced features (threading, reactions, search)

## Estimated Timeline

- Week 1: Database schema and backend API
- Week 2: Frontend components and WebSocket integration
- Week 3: HSE board and acknowledgment system
- Week 4: Testing and mobile optimization