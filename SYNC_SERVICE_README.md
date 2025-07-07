# SMS Portal Synchronization Service

## Overview

The SMS Portal Synchronization Service enables automatic data synchronization between the Onboarding Portal and the Maintenance Portal. It ensures that approved vessel configurations, equipment data, and user information are seamlessly transferred from onboarding to operational use.

## Architecture

### Components

1. **Sync Service** (`sms-app/backend/src/services/sync.service.ts`)
   - Core synchronization logic
   - Event-driven architecture
   - Configurable sync strategies

2. **Sync Controller** (`sms-app/backend/src/controllers/sync.controller.ts`)
   - REST API endpoints
   - Webhook handlers
   - Real-time SSE updates

3. **Sync Dashboard** (`sms-app/frontend/src/components/sync/SyncDashboard.tsx`)
   - React UI for monitoring and control
   - Real-time progress tracking
   - Configuration management

4. **Webhook System** (`SMS-Onboarding-Unified/backend/src/sync/sync.webhook.ts`)
   - Real-time event triggers
   - Secure webhook delivery
   - Event-based synchronization

## Features

### 1. Manual Synchronization
- On-demand full sync
- Progress tracking
- Error handling and retry logic

### 2. Scheduled Synchronization
- Cron-based scheduling
- Configurable intervals
- Automatic retry on failure

### 3. Real-time Sync (Webhooks)
- Instant updates on approval
- Event-driven architecture
- Selective data sync

### 4. Sync Monitoring
- Real-time progress updates
- Comprehensive logging
- Historical sync data

## Data Flow

```
Onboarding Portal                    Maintenance Portal
┌─────────────────┐                 ┌──────────────────┐
│                 │                 │                  │
│  Vessel/Equip   │ ─── Webhook ──▶│  Sync Service    │
│   Approved      │                 │                  │
│                 │                 │                  │
│  Sync API       │◀── API Call ───│  Fetch Data     │
│   Endpoints     │                 │                  │
│                 │                 │                  │
│  Export Data    │─── Response ──▶│  Import &        │
│                 │                 │  Transform       │
│                 │                 │                  │
└─────────────────┘                 └──────────────────┘
```

## API Endpoints

### Maintenance Portal (Sync Control)

```bash
# Trigger manual sync
POST /api/sync/trigger

# Get sync status
GET /api/sync/status
GET /api/sync/status/:syncId

# Get sync history
GET /api/sync/history?limit=50&offset=0

# Configure sync settings
POST /api/sync/settings

# Test connection
GET /api/sync/test-connection

# Real-time updates (SSE)
GET /api/sync/updates

# Webhook receiver
POST /api/sync/webhook
```

### Onboarding Portal (Data Provider)

```bash
# Sync data endpoints
GET /api/sync/vessels
GET /api/sync/equipment
GET /api/sync/users

# Export vessel data
POST /api/sync/export/:vesselId
```

## Configuration

### Environment Variables

```bash
# Copy the example file
cp sms-app/backend/.env.sync.example sms-app/backend/.env

# Configure the following:
ONBOARDING_API_URL=http://localhost:3001/api
ONBOARDING_API_KEY=your-secure-api-key
WEBHOOK_SECRET=your-webhook-secret
```

### Database Tables

The sync service creates the following tables:
- `sync_logs` - Sync operation history
- `sync_queue` - Individual sync items
- `webhook_events` - Incoming webhook tracking

## Usage

### 1. Manual Sync

```javascript
// Using the test script
node test-sync-flow.js

// Or via API
curl -X POST http://localhost:3005/api/sync/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Configure Scheduled Sync

```javascript
// Via API
curl -X POST http://localhost:3005/api/sync/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableScheduledSync": true,
    "scheduleCron": "0 */4 * * *"
  }'
```

### 3. Monitor Sync Progress

Access the Sync Dashboard in the Maintenance Portal:
- Navigate to Admin > Sync Management
- View real-time progress
- Check sync history
- Configure settings

## Sync Process Details

### 1. Vessel Synchronization
- Creates/updates company records
- Syncs vessel information
- Maintains relationships

### 2. Equipment Synchronization
- Maps equipment to vessels
- Generates QR codes if missing
- Syncs specifications and maintenance schedules
- Includes critical parts data

### 3. User Synchronization
- Maps user roles appropriately
- Creates temporary passwords for new users
- Maintains company associations

## Error Handling

### Retry Logic
- Automatic retry with exponential backoff
- Maximum 3 retry attempts
- Detailed error logging

### Conflict Resolution
- Last-write-wins strategy
- Unique identifiers (IMO, QR codes)
- Manual conflict resolution UI (planned)

## Security

### Authentication
- Bearer token authentication
- API key for service-to-service
- Webhook signature validation

### Data Protection
- No password hashes in sync
- Encrypted communication
- Audit logging

## Monitoring & Troubleshooting

### Logs
```bash
# View sync logs
tail -f sms-app/backend/logs/sync.log

# Check database logs
SELECT * FROM sync_logs ORDER BY started_at DESC;
```

### Common Issues

1. **Connection Failed**
   - Verify API URLs and ports
   - Check API key configuration
   - Ensure both portals are running

2. **Sync Stuck**
   - Check for database locks
   - Review error logs
   - Restart sync service if needed

3. **Missing Data**
   - Verify approval status in onboarding
   - Check data mapping rules
   - Review transformation logic

## Development

### Adding New Sync Types

1. Update sync service:
```typescript
private async syncNewDataType(result: SyncResult) {
  // Implementation
}
```

2. Add webhook trigger:
```typescript
async newDataApproved(dataId: string) {
  await sendWebhook(WebhookEvent.NEW_DATA_APPROVED, { data });
}
```

3. Update UI components as needed

### Testing

```bash
# Run sync tests
npm test -- sync.test.ts

# Manual testing
node test-sync-flow.js
```

## Future Enhancements

1. **Bi-directional Sync**
   - Maintenance data back to onboarding
   - Conflict resolution strategies

2. **Selective Sync**
   - Choose specific vessels/equipment
   - Filter by date range

3. **Advanced Monitoring**
   - Performance metrics
   - Sync analytics dashboard

4. **Data Validation**
   - Pre-sync validation
   - Data quality checks

5. **Bulk Operations**
   - Batch vessel sync
   - Fleet-wide updates

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Contact the development team

---

*Last Updated: [Current Date]*