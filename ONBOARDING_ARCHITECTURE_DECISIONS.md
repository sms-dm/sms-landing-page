# SMS Onboarding Portal - Architecture Decisions & Planning

## Critical Questions to Answer

### 1. Data Storage & Scale
- [ ] Where to store photos/documents? (S3, Cloudinary, self-hosted?)
- [ ] How to handle 1000+ components per vessel?
- [ ] Database strategy for massive datasets?
- [ ] Backup and disaster recovery?
- [ ] Cost implications of storage?

### 2. Infrastructure
- [ ] Hosting solution? (AWS, DigitalOcean, Vercel?)
- [ ] Same server as maintenance or separate?
- [ ] Domain strategy? (subdomain vs separate domain)
- [ ] CDN for global access?
- [ ] Auto-scaling needs?

### 3. Integration Architecture
- [ ] API gateway pattern or direct integration?
- [ ] Message queue for large exports?
- [ ] Webhook reliability?
- [ ] Authentication between systems?
- [ ] Data format standardization?

### 4. File Handling
- [ ] Image compression strategy?
- [ ] PDF processing needs?
- [ ] Virus scanning requirements?
- [ ] File size limits?
- [ ] Thumbnail generation?

### 5. Offline & Sync
- [ ] Conflict resolution strategy?
- [ ] Queue management approach?
- [ ] Partial sync capabilities?
- [ ] Data compression for sync?
- [ ] Offline storage limits?

### 6. Security & Compliance
- [ ] Data encryption at rest?
- [ ] GDPR compliance needs?
- [ ] Audit trail requirements?
- [ ] Data retention policies?
- [ ] Access control granularity?

### 7. Performance
- [ ] Expected concurrent users?
- [ ] Data query optimization?
- [ ] Caching strategy?
- [ ] Load testing approach?
- [ ] Performance monitoring?

### 8. Business Logic
- [ ] Quality score algorithm details?
- [ ] Missing data detection rules?
- [ ] Approval workflow variations?
- [ ] Notification triggers?
- [ ] Report generation needs?

## How I Would Build This (Without Constraints)

### Architecture Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   Application   │────▶│   PostgreSQL    │
│      (CDN)      │     │   Load Balancer │     │   (Primary)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   S3 Bucket     │     │   Node.js App   │     │   Read Replica  │
│   (Files)       │◀────│   Cluster (3x)  │     │   (Reports)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Redis Cache   │
                        │   + Queue       │
                        └─────────────────┘
```

### My Recommended Tech Stack

#### Storage Solution
**Choice: AWS S3 + CloudFront**
- **Why**: Infinitely scalable, pay-per-use, global CDN
- **Cost**: ~$0.023/GB/month + transfer costs
- **Implementation**:
  ```javascript
  // Direct browser upload to S3 (no server load)
  const uploadToS3 = async (file) => {
    const presignedUrl = await getPresignedUrl(file.type);
    await uploadDirect(presignedUrl, file);
    return s3FileUrl;
  };
  ```

#### Database Architecture
**Choice: PostgreSQL with smart partitioning**
```sql
-- Partition by company for isolation
CREATE TABLE equipment (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    vessel_id UUID NOT NULL,
    location_id UUID NOT NULL,
    data JSONB NOT NULL -- Flexible schema
) PARTITION BY LIST (company_id);

-- Automatic partitions per company
CREATE TABLE equipment_oceanic PARTITION OF equipment
FOR VALUES IN ('oceanic-uuid');
```

#### File Processing Pipeline
```javascript
// Async processing queue
const processUpload = async (job) => {
  const { fileUrl, type } = job.data;
  
  if (type === 'image') {
    await generateThumbnails(fileUrl);
    await extractEXIFData(fileUrl);
    await runOCR(fileUrl); // Extract text from nameplates
  }
  
  if (type === 'pdf') {
    await extractPDFText(fileUrl);
    await generatePDFThumbnail(fileUrl);
  }
  
  await updateSearchIndex(fileUrl);
};
```

#### Offline-First Architecture
**Choice: PouchDB + CouchDB**
```javascript
// Local-first with automatic sync
const localDB = new PouchDB('onboarding');
const remoteDB = new PouchDB('https://api.sms.com/db/onboarding');

// Bi-directional sync with conflict resolution
localDB.sync(remoteDB, {
  live: true,
  retry: true,
  conflicts: 'resolveByTimestamp'
});
```

### Data Management Strategy

#### 1. Hierarchical Data Model
```typescript
interface Vessel {
  id: string;
  name: string;
  imo: string;
  locations: Location[];
}

interface Location {
  id: string;
  name: string;
  path: string; // "Engine Room/Starboard/Panel A"
  parentId?: string;
  equipment: Equipment[];
  metadata: {
    deck?: string;
    frame?: string;
    coordinates?: [number, number];
  };
}

interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  specifications: Record<string, any>; // Flexible
  documents: Document[];
  photos: Photo[];
  components?: Component[]; // For complex equipment
}

interface Component {
  id: string;
  name: string;
  type: string;
  partNumber?: string;
  parentEquipmentId: string;
}
```

#### 2. Smart Data Collection
```javascript
// Progressive detail collection
const dataCollectionStrategy = {
  required: ['name', 'type', 'location', 'photo'],
  recommended: ['manufacturer', 'model', 'serialNumber'],
  optional: ['specifications', 'documents', 'components'],
  
  // Quality score based on completeness
  calculateScore: (equipment) => {
    let score = 0;
    if (hasRequired(equipment)) score += 40;
    if (hasRecommended(equipment)) score += 40;
    if (hasOptional(equipment)) score += 20;
    return score;
  }
};
```

#### 3. Handling Massive Component Lists
```javascript
// Virtual scrolling for 1000+ components
const ComponentList = () => {
  return (
    <VirtualList
      height={600}
      itemCount={components.length}
      itemSize={80}
      overscan={5}
    >
      {({ index, style }) => (
        <ComponentRow
          component={components[index]}
          style={style}
        />
      )}
    </VirtualList>
  );
};

// Batch operations
const bulkAddComponents = async (equipmentId, components) => {
  // Process in chunks to avoid overwhelming the system
  const chunks = chunk(components, 100);
  
  for (const chunk of chunks) {
    await db.components.bulkCreate(chunk);
    await updateProgress(chunk.length);
  }
};
```

### Performance Optimizations

#### 1. Smart Caching
```javascript
// Multi-level caching
const cache = {
  memory: new LRUCache({ max: 1000 }), // Hot data
  redis: new Redis(), // Shared cache
  cdn: 'CloudFront', // Static assets
  
  get: async (key) => {
    return memory.get(key) 
      || await redis.get(key) 
      || await fetchFromDB(key);
  }
};
```

#### 2. Data Compression
```javascript
// Compress large datasets before transfer
const exportVesselData = async (vesselId) => {
  const data = await collectVesselData(vesselId);
  const compressed = await gzip(JSON.stringify(data));
  
  // Stream in chunks for large vessels
  return streamInChunks(compressed, 1024 * 1024); // 1MB chunks
};
```

### Security Implementation

#### 1. Zero-Trust Architecture
```javascript
// Every request validated
const validateRequest = async (req) => {
  await verifyJWT(req.token);
  await checkPermissions(req.user, req.resource);
  await validateCompanyAccess(req.user.companyId, req.params.vesselId);
  await rateLimitCheck(req.user);
};
```

#### 2. Data Encryption
```javascript
// Encrypt sensitive data at rest
const encryptSensitiveData = (data) => {
  const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY);
  return cipher.update(JSON.stringify(data), 'utf8', 'hex');
};
```

### Integration Architecture

#### 1. Event-Driven Integration
```javascript
// Publish events for maintenance portal
const eventBus = new EventEmitter();

eventBus.on('vessel.approved', async (vessel) => {
  await queue.add('export-to-maintenance', {
    vesselId: vessel.id,
    priority: 'high'
  });
});

eventBus.on('data.quality.low', async (equipment) => {
  await notificationService.send({
    type: 'quality-alert',
    equipment,
    suggestions: generateImprovementSuggestions(equipment)
  });
});
```

#### 2. Smart Data Export
```javascript
// Transform and export to maintenance format
const exportToMaintenance = async (vesselId) => {
  const vessel = await getVesselWithRelations(vesselId);
  
  const maintenanceFormat = {
    vessel: transformVessel(vessel),
    equipment: vessel.equipment.map(transformEquipment),
    users: vessel.users.map(transformUser),
    documents: await packageDocuments(vessel),
  };
  
  // Use message queue for reliability
  await messageQueue.publish('maintenance.import', maintenanceFormat);
};
```

### Cost Optimization

#### 1. Smart Storage Tiering
```javascript
// Move old files to cheaper storage
const archiveOldFiles = async () => {
  const oldFiles = await getFilesOlderThan(90); // 90 days
  
  for (const file of oldFiles) {
    await s3.copyObject({
      from: 'hot-bucket',
      to: 'cold-bucket', // Glacier
      key: file.key
    });
  }
};
```

#### 2. Intelligent Caching
```javascript
// Cache frequently accessed data
const smartCache = {
  shouldCache: (resource) => {
    return resource.accessCount > 10 
      || resource.isVesselSummary 
      || resource.isRecentlyUpdated;
  }
};
```

## Decision Log Template

### Decision #001: File Storage Solution
**Date**: 2024-07-03
**Decision**: AWS S3 + CloudFront CDN
**Rationale**: Cost-effective, infinitely scalable, global CDN, handles large files, direct browser upload
**Alternatives Considered**: Cloudinary (too expensive), Self-hosted (too much maintenance), DigitalOcean Spaces (less features)
**Trade-offs**: Pros: Scalable, reliable, fast. Cons: AWS complexity, vendor lock-in
**Cost Implications**: ~$62/month for 100 vessels (500GB storage + CDN delivery)
**Notes**: Focus on overview photos, not individual components. Part numbers and quantities are priority.

### Decision #002: Database Architecture
**Date**: 2024-07-03
**Decision**: PostgreSQL with RDS encryption and Row Level Security
**Rationale**: Enterprise-grade security, maritime compliance ready, same as maintenance portal, proven at scale
**Alternatives Considered**: MongoDB (weaker security), MySQL (less features), DynamoDB (expensive)
**Trade-offs**: Pros: Secure, compliant, scalable. Cons: Slightly more complex than NoSQL
**Performance Implications**: Excellent with proper indexing and partitioning
**Security Features**: AES-256 encryption, RLS isolation, SSL/TLS, audit trails
**Compliance**: Meets IMO 2021 cyber requirements and IACS UR E26/E27 standards
**Cost**: RDS with encryption ~$70-220/month depending on size

### Decision #003: Hosting Infrastructure
**Date**: 2024-07-03
**Decision**: AWS multi-region deployment
**Rationale**: Integrates with S3/CloudFront, global reach, auto-scaling, security features built-in
**Alternatives Considered**: Vercel/Netlify (split infrastructure), DigitalOcean (less global), Self-hosted (too much overhead)
**Trade-offs**: Pros: One ecosystem, proven scale, global. Cons: AWS complexity, vendor lock-in
**Performance Implications**: Excellent with CloudFront CDN and multi-region
**Cost**: ~$175-275/month (EC2 + Load Balancer + Transfer)

### Decision #004: Offline Sync Strategy
**Date**: 2024-07-03
**Decision**: Progressive Web App (PWA) with IndexedDB + Service Workers
**Rationale**: Works on any device, no app store needed, handles gigabytes offline, auto-sync, single codebase
**Alternatives Considered**: Native apps (2x development), Local server (too complex), Manual sync (error prone)
**Trade-offs**: Pros: Free, universal, auto-updates. Cons: Less native features (don't need them)
**Performance Implications**: Excellent - stores data locally on device
**Cost**: $0 additional cost (uses existing infrastructure)
**Technical**: Service workers for offline, IndexedDB for storage, Background sync API

### Decision #005: Integration Architecture
**Date**: 2024-07-03
**Decision**: API Gateway + Message Queue (AWS SQS)
**Rationale**: Never loses data, handles large vessels, automatic retry, progress tracking, secure
**Alternatives Considered**: Direct API (timeout risk), Database sync (security risk), Manual export (not scalable)
**Trade-offs**: Pros: Reliable, scalable, secure. Cons: Slightly more complex than direct calls
**Performance Implications**: Excellent - asynchronous processing, no timeouts
**Cost**: ~$0.40 per million messages + $3.50 per million API calls (negligible)
**Technical**: REST API → API Gateway → SQS → Maintenance Portal

### Decision #006: Email Service Provider
**Date**: 2024-07-03
**Decision**: AWS SES with multiple sender addresses
**Rationale**: Already in AWS, incredibly cheap ($0.10/1000), great deliverability, supports multiple from addresses
**Alternatives Considered**: SendGrid ($25+/month), Mailgun ($15/month), SMTP relay (poor deliverability)
**Trade-offs**: Pros: Cheap, reliable, integrated. Cons: Less marketing features than dedicated ESPs
**Cost**: ~$0.10-1.00/month for typical usage
**Features**: Multiple from addresses, automated maintenance alerts, inspection reminders, escalation rules
**Email Addresses**: notifications@, inspections@, marketing@, support@, alerts@, noreply@

### Decision #007: Quality Score Algorithm
**Date**: 2024-07-03
**Decision**: Per-equipment scoring (0-100) with weighted factors
**Rationale**: Drives behavior, fair scoring, identifies revenue opportunities
**Scoring Breakdown**: Required (40pts), Photos (30pts), Details (20pts), Documentation (10pts)
**Component Handling**: Score completeness not perfection - "80% components listed" = good score
**Thresholds**: 0-39 (Red), 40-69 (Yellow), 70-89 (Green), 90-100 (Gold)
**Revenue Tracking**: Missing items tracked as opportunities (schematics $3k, manuals $1k)
**Note**: Each equipment scored individually, vessel gets average score

### Decision #008: Critical Parts & Inventory Intelligence
**Date**: 2024-07-03
**Decision**: Criticality-based documentation with cross-reference intelligence
**Rationale**: Focus on what matters, prevent stockouts of critical parts
**Key Features**: 
  - Equipment marked as Critical/Important/Standard
  - Critical equipment requires failure parts documentation
  - Automatic cross-referencing shows parts used in multiple locations
  - Smart warnings when stock low vs. critical usage
**What we DON'T do**: No downtime predictions, no location tracking, no cost estimates
**UI Flow**: Critical toggle → Document failure parts → System cross-references automatically
**Value**: Prevents critical stockouts, identifies standardization opportunities

### Decision #009: UI Framework & Design System
**Date**: 2024-07-03
**Decision**: React + Tailwind CSS + Shadcn/ui
**Rationale**: Consistent with maintenance portal, professional look, mobile-first, fast development
**Alternatives Considered**: Material UI (too generic), Ant Design (wrong aesthetic), Custom CSS (too slow)
**Trade-offs**: Pros: Beautiful, customizable, copy-paste components. Cons: Need to learn Shadcn patterns
**Performance**: Excellent - minimal bundle size, tree-shakeable
**Cost**: $0 - All open source
**Look & Feel**: Premium (Stripe/Linear style), smooth animations, touch-friendly (44px targets)

### Decision #010: Development & Deployment Strategy
**Date**: 2024-07-03
**Decision**: Monorepo structure with shared packages
**Rationale**: Code reuse between portals, single deployment pipeline, consistent updates
**Structure**: packages/ (shared-types, ui-components, api-client), apps/ (maintenance, onboarding)
**Deployment**: GitHub Actions → AWS ECS, blue-green deployments, automatic rollback
**Alternatives Considered**: Separate repos (harder to maintain), Manual deployment (error prone)
**Trade-offs**: Pros: Professional CI/CD, code sharing, one repo. Cons: Initial setup complexity
**Cost**: GitHub Actions (free), ECS (~$50/month)
**Benefits**: Shared code, consistent deployments, professional from day one

[Continue for each decision...]

## Next Steps

1. Review my recommendations
2. Discuss each architecture decision
3. Log our choices in the decision log
4. Create detailed implementation plan
5. Set up development environment
6. Begin implementation with Shadow Clone

## Questions for You

1. What's your budget for infrastructure?
2. Expected number of vessels in first year?
3. Average photos per vessel?
4. Preferred cloud provider?
5. Any regulatory requirements?
6. Disaster recovery needs?
7. Expected global reach?

Let's work through these systematically!