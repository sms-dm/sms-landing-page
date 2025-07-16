# SMS Phase 2 Roadmap - Smart Drawing Platform

## Overview
After completing Phase 1 (Portal Integration & Launch), Phase 2 introduces the Smart Drawing Platform - a game-changing feature that could double per-vessel revenue.

## Phase 1 Prerequisites (Current Focus)
- [ ] Portal Integration (3-4 weeks)
- [ ] Production Deployment
- [ ] First 25 vessels onboarded
- [ ] Revenue model validated

## Phase 2: Smart Drawing Platform (Weeks 17-32)

### Phase 2.1: Foundation (Weeks 17-22)
**Goal**: Basic drawing management system

**Sprint 1-2**: Upload & Storage
- Drawing upload interface (PDF, JPG, PNG, DWG)
- S3 storage with vessel/equipment organization
- Basic viewer with zoom/pan/rotate
- Drawing metadata (title, revision, date)

**Sprint 3**: Equipment Linking
- Link drawings to equipment records
- Drawing categories (electrical, mechanical, P&ID)
- Basic access control

**Deliverable**: Functional drawing repository

### Phase 2.2: Intelligence Layer (Weeks 23-28)
**Goal**: Make drawings searchable and smart

**Sprint 4-5**: OCR & Search
- Tesseract.js integration for text extraction
- Elasticsearch indexing of drawing content
- Search interface ("show all 440V breakers")
- Text highlighting in results

**Sprint 6**: Symbol Recognition
- OpenCV.js integration
- Pre-trained models for common electrical symbols
- Manual tagging interface for corrections
- Equipment auto-suggestion based on symbols

**Deliverable**: Searchable, tagged drawing system

### Phase 2.3: Advanced Features (Weeks 29-32)
**Goal**: Revolutionary features that justify premium pricing

**Sprint 7**: Interactive Features
- Click equipment to highlight on drawing
- Fault-to-drawing navigation
- Circuit path tracing
- Real-time collaboration tools

**Sprint 8**: Fleet Intelligence
- SMS-branded drawing generation
- Batch standardization tools
- Version control and change tracking
- Offline sync for vessel access

**Deliverable**: Complete Smart Drawing Platform

## Revenue Impact

### Pricing Model
**Basic SMS**: $1,000/vessel/month
**With Smart Drawings**: $1,500/vessel/month (+50%)

### Additional Revenue Streams
1. **Drawing Conversion Service**: $50-100/drawing
   - Average vessel: 200-500 drawings = $10k-50k one-time

2. **Fleet Standardization Package**: $10k-25k
   - Convert all fleet drawings to SMS standard
   - Create drawing templates
   - Training included

3. **Premium Support**: $500/month
   - Priority drawing processing
   - Custom symbol libraries
   - Dedicated support

### ROI Projection
- 100 vessels on premium tier = +$50k/month
- 20 conversion projects/year = +$400k
- 5 fleet packages/year = +$100k
- **Total Phase 2 Revenue**: +$1M/year

## Technical Architecture

```javascript
// Smart Drawing Platform Architecture
const DrawingPlatform = {
  // Core Services
  storage: 'AWS S3',
  processing: 'Lambda Functions',
  search: 'Elasticsearch',
  database: 'PostgreSQL',
  
  // Processing Pipeline
  pipeline: [
    'Upload → S3',
    'Lambda → PDF to Image',
    'Tesseract → OCR',
    'OpenCV → Symbol Detection',
    'Elasticsearch → Index',
    'PostgreSQL → Metadata'
  ],
  
  // Frontend Stack
  viewer: 'Fabric.js Canvas',
  ui: 'React + TypeScript',
  offline: 'Service Worker + IndexedDB'
};
```

## Success Metrics

### Phase 2.1 Success
- 500+ drawings uploaded
- 5 vessels using system
- 95% accuracy in OCR

### Phase 2.2 Success  
- 80% symbol recognition accuracy
- <2 second search results
- 50% reduction in drawing lookup time

### Phase 2.3 Success
- 25 vessels on premium tier
- 5 fleet standardization projects
- 90% user satisfaction

## Risk Mitigation

### Technical Risks
- **OCR Accuracy**: Start with manual tagging fallback
- **Performance**: Implement progressive loading
- **Offline Sync**: Selective sync of frequently used drawings

### Business Risks
- **Adoption**: Include free trial period
- **Competition**: Patent key innovations
- **Pricing**: A/B test pricing tiers

## Next Steps

1. **Complete Phase 1** (Current Focus)
2. **Validate Demand**: Survey first 25 vessels about drawing pain points
3. **Build Prototype**: 2-week spike to prove core concepts
4. **Secure Resources**: Either hire specialists or partner with CV company
5. **Execute Phase 2.1**: Start with basic upload/view functionality

## Conclusion

The Smart Drawing Platform represents a massive opportunity to:
- Double per-vessel revenue
- Create a significant competitive moat
- Solve a real, painful problem for offshore crews
- Generate multiple revenue streams

With the foundation we've built in Phase 1, Phase 2 is not just possible - it's the logical next step to market dominance.