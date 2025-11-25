# SMS Project Performance Optimization Plan
*Wave 4 - Performance Engineering for Maritime Environments*

## Executive Summary

This document outlines comprehensive performance optimization strategies for the SMS Onboarding and Maintenance portals, specifically designed for harsh maritime environments with slow vessel connections. The plan addresses mobile performance, scalability to 100+ vessels, and offline-first capabilities.

## Current Performance Baseline

### Frontend Analysis
- **Tech Stack**: React 18.2, Vite 5.0, TypeScript
- **Bundle Size**: Currently using code splitting with vendor chunks
- **PWA**: Basic implementation with service worker
- **State Management**: Redux Toolkit + React Query
- **Offline Support**: Dexie.js for IndexedDB + basic sync queue

### Backend Analysis
- **Tech Stack**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL with performance indexes
- **Caching**: Redis for session management
- **File Storage**: AWS S3 for documents/images

### Critical Performance Issues
1. **Large Bundle Sizes**: AWS SDK and Supabase client in frontend
2. **Unoptimized Images**: No automatic compression/resizing
3. **Limited Caching**: Basic service worker, no CDN
4. **Database Queries**: Missing connection pooling configuration
5. **Mobile Performance**: Limited optimization for slow connections

## Performance Targets

### Mobile Performance (4G/3G)
- **First Contentful Paint (FCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 4s
- **Largest Contentful Paint (LCP)**: < 3s
- **Cumulative Layout Shift (CLS)**: < 0.1

### Vessel Connection (Satellite/VSAT)
- **Initial Load**: < 10s
- **Subsequent Loads**: < 3s (cached)
- **API Response Time**: < 500ms (cached), < 2s (network)
- **Offline Mode**: Full functionality

### Scalability Targets
- **Concurrent Users**: 1000+
- **Vessels Supported**: 100+
- **Database Connections**: 200 concurrent
- **API Throughput**: 1000 req/sec

## Optimization Strategies

### 1. Frontend Optimization

#### Bundle Size Reduction
```javascript
// vite.config.ts improvements
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'data-vendor': ['@tanstack/react-query', '@reduxjs/toolkit'],
          // Move heavy dependencies to dynamic imports
        }
      }
    },
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

#### Dynamic Imports for Heavy Features
```typescript
// Lazy load AWS SDK only when needed
const uploadToS3 = async (file: File) => {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  // Implementation
};

// Lazy load chart libraries
const AnalyticsDashboard = lazy(() => import('./features/analytics/Dashboard'));
```

#### Progressive Image Loading
```typescript
// Image optimization service
class ImageOptimizationService {
  async optimizeForMobile(file: File): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize to max 1920x1080 for mobile
    // Convert to WebP with fallback to JPEG
    // Quality: 0.8 for photos, 0.9 for documents
    
    return await this.compressImage(canvas, {
      format: this.supportsWebP() ? 'webp' : 'jpeg',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    });
  }
  
  generateSrcSet(imageUrl: string): string {
    return `
      ${imageUrl}?w=320 320w,
      ${imageUrl}?w=640 640w,
      ${imageUrl}?w=1280 1280w,
      ${imageUrl}?w=1920 1920w
    `;
  }
}
```

### 2. Advanced Caching Strategies

#### Enhanced Service Worker
```javascript
// sw.js - Intelligent caching strategies
const CACHE_STRATEGIES = {
  // Network first with timeout for API calls
  networkFirstWithTimeout: async (request, timeout = 3000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );
    
    try {
      const networkResponse = await Promise.race([
        fetch(request),
        timeoutPromise
      ]);
      
      // Cache successful responses
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Fallback to cache
      return caches.match(request) || new Response('Offline', { status: 503 });
    }
  },
  
  // Stale while revalidate for assets
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Return cached immediately
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response);
        }
      });
      
      return cachedResponse;
    }
    
    // No cache, fetch from network
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }
};
```

#### CDN Configuration
```nginx
# nginx.conf for edge caching
location ~* \.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
    
    # Enable gzip/brotli compression
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    brotli on;
    brotli_types text/css application/javascript image/svg+xml;
}

# API responses with short cache
location /api/ {
    expires 5m;
    add_header Cache-Control "private, must-revalidate";
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 3. Database Optimization

#### Connection Pooling
```typescript
// prisma configuration
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings for maritime environments
  connection: {
    connectionLimit: 20,        // Max connections
    connectTimeout: 30000,      // 30s timeout for slow connections
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  }
});
```

#### Query Optimization
```sql
-- Materialized view for vessel dashboard
CREATE MATERIALIZED VIEW vessel_dashboard_stats AS
SELECT 
    v.id as vessel_id,
    v.name as vessel_name,
    COUNT(DISTINCT e.id) as total_equipment,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'APPROVED') as approved_equipment,
    COUNT(DISTINCT e.id) FILTER (WHERE e.criticality = 'CRITICAL') as critical_equipment,
    AVG(e.quality_score) as avg_quality_score,
    MAX(e.updated_at) as last_updated
FROM vessels v
LEFT JOIN equipment e ON e.vessel_id = v.id
GROUP BY v.id, v.name;

-- Refresh every hour
CREATE INDEX idx_vessel_dashboard_stats ON vessel_dashboard_stats(vessel_id);
```

#### Pagination and Cursor-based Loading
```typescript
// Efficient pagination for large datasets
async function getEquipmentPage(vesselId: string, cursor?: string, limit = 20) {
  return await prisma.equipment.findMany({
    where: {
      vesselId,
      id: cursor ? { gt: cursor } : undefined
    },
    take: limit + 1, // Fetch one extra to check if there's more
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      criticality: true,
      status: true,
      // Only select needed fields
    }
  });
}
```

### 4. API Performance

#### Response Compression
```typescript
// Middleware for compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression
  threshold: 1024 // Only compress responses > 1KB
}));
```

#### Efficient Data Transfer
```typescript
// GraphQL-like field selection
app.get('/api/equipment/:id', async (req, res) => {
  const fields = req.query.fields?.split(',') || [];
  const includeRelations = req.query.include?.split(',') || [];
  
  const equipment = await prisma.equipment.findUnique({
    where: { id: req.params.id },
    select: fields.length > 0 
      ? Object.fromEntries(fields.map(f => [f, true]))
      : undefined,
    include: includeRelations.length > 0
      ? Object.fromEntries(includeRelations.map(r => [r, true]))
      : undefined
  });
  
  res.json(equipment);
});
```

### 5. Mobile-Specific Optimizations

#### Adaptive Loading
```typescript
// Network-aware loading
class AdaptiveLoader {
  async loadContent() {
    const connection = navigator.connection;
    
    if (connection) {
      // Adjust based on connection quality
      if (connection.effectiveType === '2g' || connection.saveData) {
        return this.loadLowQualityContent();
      } else if (connection.effectiveType === '3g') {
        return this.loadMediumQualityContent();
      }
    }
    
    return this.loadHighQualityContent();
  }
  
  loadLowQualityContent() {
    // Text only, no images
    // Minimal API calls
    // Essential features only
  }
}
```

#### Touch Optimization
```typescript
// Debounced touch handlers for better performance
const useDebouncedTouch = (callback: Function, delay = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
  
  return debouncedCallback;
};
```

### 6. Offline-First Architecture

#### Enhanced Sync Queue
```typescript
class OfflineSyncQueue {
  private queue: SyncOperation[] = [];
  private syncing = false;
  
  async addOperation(operation: SyncOperation) {
    // Deduplicate operations
    const existingIndex = this.queue.findIndex(
      op => op.entity === operation.entity && op.id === operation.id
    );
    
    if (existingIndex >= 0) {
      // Merge operations
      this.queue[existingIndex] = this.mergeOperations(
        this.queue[existingIndex], 
        operation
      );
    } else {
      this.queue.push(operation);
    }
    
    // Persist to IndexedDB
    await this.persistQueue();
    
    // Try to sync if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.syncing || this.queue.length === 0) return;
    
    this.syncing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 10); // Process in batches
      
      try {
        await this.syncBatch(batch);
      } catch (error) {
        // Return failed operations to queue
        this.queue.unshift(...batch);
        break;
      }
    }
    
    this.syncing = false;
  }
}
```

### 7. Monitoring and Analytics

#### Performance Monitoring
```typescript
// Real User Monitoring (RUM)
class PerformanceMonitor {
  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    // Send to analytics endpoint
    navigator.sendBeacon('/api/analytics/metrics', JSON.stringify({
      metric: name,
      value,
      tags: {
        ...tags,
        connectionType: navigator.connection?.effectiveType,
        deviceMemory: navigator.deviceMemory,
        platform: navigator.platform
      },
      timestamp: Date.now()
    }));
  }
  
  measureApiCall(endpoint: string) {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        this.trackMetric('api.response_time', duration, { endpoint });
      }
    };
  }
}
```

## Implementation Plan

### Phase 1: Critical Optimizations (Week 1-2)
1. Implement code splitting and dynamic imports
2. Set up enhanced service worker with intelligent caching
3. Configure database connection pooling
4. Implement image optimization pipeline

### Phase 2: Mobile Performance (Week 3-4)
1. Implement adaptive loading based on connection
2. Optimize touch interactions and animations
3. Set up progressive image loading
4. Implement offline-first sync queue

### Phase 3: Infrastructure (Week 5-6)
1. Configure CDN for static assets
2. Set up Redis caching for API responses
3. Implement materialized views for dashboards
4. Configure nginx for optimal caching

### Phase 4: Monitoring & Testing (Week 7-8)
1. Set up performance monitoring
2. Implement A/B testing for optimizations
3. Load testing with maritime connection simulation
4. Performance regression testing

## Performance Budget

### Bundle Sizes
- **Initial JS**: < 200KB (gzipped)
- **Initial CSS**: < 50KB (gzipped)
- **Lazy-loaded chunks**: < 100KB each
- **Total application**: < 2MB

### Network Requests
- **Initial load**: < 10 requests
- **API calls per view**: < 5 requests
- **Batch where possible**

### Memory Usage
- **Mobile devices**: < 100MB active
- **IndexedDB**: < 500MB per vessel
- **Image cache**: < 200MB

## Testing Strategy

### Synthetic Testing
```bash
# Simulate slow vessel connection
npm run test:performance -- --network=slow-3g --cpu-slowdown=4

# Test with limited device memory
npm run test:performance -- --device-memory=512
```

### Real Device Testing
- Test on actual mobile devices with throttled connections
- Use remote device labs for various Android/iOS versions
- Test in airplane mode for offline functionality

### Load Testing
```javascript
// k6 load test for 100 concurrent vessels
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};
```

## Success Metrics

### Performance KPIs
1. **Page Load Time**: 70% reduction for repeat visits
2. **API Response Time**: 50% reduction with caching
3. **Offline Capability**: 100% core feature availability
4. **User Engagement**: 40% increase in mobile usage

### Business Impact
1. **Reduced Support Tickets**: 30% fewer connectivity issues
2. **Increased Adoption**: 25% more vessels onboarded
3. **Data Quality**: 20% improvement from faster sync
4. **User Satisfaction**: NPS score > 8

## Conclusion

This performance optimization plan addresses the unique challenges of maritime environments while ensuring scalability to 100+ vessels. The focus on offline-first architecture, intelligent caching, and mobile optimization will significantly improve user experience even on the slowest vessel connections.

The phased implementation approach allows for iterative improvements while maintaining system stability. Regular monitoring and testing ensure that performance gains are sustained as the system grows.