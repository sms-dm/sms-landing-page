# SMS Cost Optimization & Scaling Guide

## Executive Summary

This guide provides strategies for optimizing cloud infrastructure costs while maintaining performance and preparing for scale from pilot (3-5 vessels) to production (100+ vessels). Expected cost progression: $500/month (pilot) → $1,400/month (20 vessels) → $3,500/month (100+ vessels).

## 1. Cost Analysis & Baseline

### 1.1 Current Infrastructure Costs (Pilot Phase - 5 Vessels)

```yaml
Monthly Cost Breakdown:
  Compute:
    - ECS Fargate (minimal): $120
    - Lambda functions: $5
    
  Database:
    - RDS t3.medium (Single-AZ): $70
    - Backup storage: $10
    
  Storage:
    - S3 (100GB): $25
    - EBS volumes: $15
    
  Network:
    - ALB: $25
    - NAT Gateway: $45
    - Data Transfer: $50
    - CloudFront: $20
    
  Security & Monitoring:
    - WAF: $5
    - CloudWatch: $15
    - Secrets Manager: $10
    
  Total: ~$415/month
```

### 1.2 Growth Projections

```yaml
Scaling Costs:
  20 Vessels:
    - Compute: $400
    - Database: $250 (Multi-AZ)
    - Storage: $150
    - Network: $300
    - Other: $100
    - Total: ~$1,200/month
    
  50 Vessels:
    - Compute: $800
    - Database: $500 (with replicas)
    - Storage: $400
    - Network: $600
    - Other: $200
    - Total: ~$2,500/month
    
  100+ Vessels:
    - Compute: $1,200
    - Database: $800
    - Storage: $800
    - Network: $1,000
    - Other: $300
    - Total: ~$4,100/month
```

## 2. Cost Optimization Strategies

### 2.1 Compute Optimization

```javascript
// Dynamic scaling based on business hours
const scalingSchedule = {
  // Business hours: More capacity
  businessHours: {
    schedule: '0 7 * * MON-FRI',
    minTasks: 3,
    maxTasks: 20,
    targetCPU: 70
  },
  
  // Off hours: Minimal capacity
  offHours: {
    schedule: '0 19 * * MON-FRI',
    minTasks: 1,
    maxTasks: 5,
    targetCPU: 80
  },
  
  // Weekends: Very minimal
  weekends: {
    schedule: '0 0 * * SAT',
    minTasks: 1,
    maxTasks: 3,
    targetCPU: 85
  }
};

// Implement with CloudWatch Events
const createScheduledScaling = async (ruleName, config) => {
  const cloudwatch = new AWS.CloudWatchEvents();
  const appautoscaling = new AWS.ApplicationAutoScaling();
  
  // Create CloudWatch rule
  await cloudwatch.putRule({
    Name: `sms-scaling-${ruleName}`,
    ScheduleExpression: `cron(${config.schedule})`,
    State: 'ENABLED'
  }).promise();
  
  // Update Auto Scaling
  await appautoscaling.putScheduledAction({
    ServiceNamespace: 'ecs',
    ResourceId: 'service/sms-cluster/api-service',
    ScalableDimension: 'ecs:service:DesiredCount',
    ScheduledActionName: ruleName,
    Schedule: config.schedule,
    ScalableTargetAction: {
      MinCapacity: config.minTasks,
      MaxCapacity: config.maxTasks
    }
  }).promise();
};
```

### 2.2 Database Cost Optimization

```sql
-- Implement table partitioning for large tables
CREATE TABLE vessel_telemetry_2024_q1 PARTITION OF vessel_telemetry
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Archive old partitions to cheaper storage
CREATE OR REPLACE FUNCTION archive_old_partitions()
RETURNS void AS $$
DECLARE
  partition_name text;
  archive_date date := CURRENT_DATE - INTERVAL '90 days';
BEGIN
  FOR partition_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'vessel_telemetry_%'
    AND tablename < 'vessel_telemetry_' || to_char(archive_date, 'YYYY_MM')
  LOOP
    -- Export to S3
    EXECUTE format(
      'COPY %I TO PROGRAM ''aws s3 cp - s3://sms-archive/%I.csv.gz --sse'' CSV HEADER GZIP',
      partition_name, partition_name
    );
    
    -- Drop old partition
    EXECUTE format('DROP TABLE %I', partition_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly execution
SELECT cron.schedule('archive-partitions', '0 2 1 * *', 'SELECT archive_old_partitions()');
```

### 2.3 Storage Optimization

```javascript
// Intelligent S3 lifecycle management
const s3LifecycleRules = {
  userUploads: {
    transitions: [
      {
        days: 0,
        storageClass: 'INTELLIGENT_TIERING'
      }
    ]
  },
  
  vesselDocuments: {
    transitions: [
      {
        days: 30,
        storageClass: 'STANDARD_IA'
      },
      {
        days: 90,
        storageClass: 'GLACIER_IR'
      }
    ]
  },
  
  logs: {
    transitions: [
      {
        days: 7,
        storageClass: 'STANDARD_IA'
      },
      {
        days: 30,
        storageClass: 'GLACIER'
      }
    ],
    expiration: {
      days: 90
    }
  }
};

// Image optimization before storage
const optimizeImage = async (imageBuffer) => {
  const sharp = require('sharp');
  
  // Create multiple versions
  const versions = await Promise.all([
    // Thumbnail for lists
    sharp(imageBuffer)
      .resize(150, 150)
      .jpeg({ quality: 80 })
      .toBuffer(),
      
    // Medium for detail views
    sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer(),
      
    // Full size but compressed
    sharp(imageBuffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer()
  ]);
  
  // Store only necessary versions
  return {
    thumbnail: versions[0],
    medium: versions[1],
    full: versions[2]
  };
};
```

### 2.4 Network Cost Optimization

```yaml
CloudFront Optimization:
  # Cache as much as possible
  Cache Behaviors:
    # Static assets - 1 year cache
    /static/*:
      TTL: 31536000
      Compress: true
      
    # API responses - Vary by user
    /api/*:
      TTL: 0
      Forward Headers: [Authorization]
      
    # Images - 30 days cache
    /images/*:
      TTL: 2592000
      Compress: false
      QueryString: false

Data Transfer Optimization:
  # Use CloudFront for all static content
  - Serve images via CloudFront
  - Bundle JavaScript/CSS files
  - Enable compression
  
  # Minimize API payload
  - Use pagination (max 50 records)
  - Implement field filtering
  - Use GraphQL for precise data fetching
```

## 3. Reserved Capacity Planning

### 3.1 Reserved Instance Strategy

```python
# calculate_reserved_capacity.py
def calculate_optimal_reserved_instances(usage_data):
    """Calculate optimal RI purchases based on usage patterns"""
    
    recommendations = {
        'rds': {},
        'elasticache': {},
        'compute_savings_plan': 0
    }
    
    # RDS Reserved Instances
    baseline_db_usage = min(usage_data['rds_usage'])
    if baseline_db_usage > 0.7:  # 70% consistent usage
        recommendations['rds'] = {
            'instance_type': 'db.r6g.large',
            'term': '1-year',
            'payment': 'all-upfront',
            'count': 1,
            'savings': '$1,200/year'
        }
    
    # ElastiCache Reserved Nodes
    baseline_cache_usage = min(usage_data['cache_usage'])
    if baseline_cache_usage > 0.8:
        recommendations['elasticache'] = {
            'node_type': 'cache.r6g.large',
            'term': '1-year',
            'payment': 'partial-upfront',
            'count': 3,
            'savings': '$800/year'
        }
    
    # Compute Savings Plan
    baseline_compute = min(usage_data['compute_spend'])
    recommendations['compute_savings_plan'] = {
        'commitment': baseline_compute * 0.7,  # 70% of baseline
        'term': '1-year',
        'savings': f"${baseline_compute * 0.3 * 12}/year"
    }
    
    return recommendations
```

### 3.2 Implementation Timeline

```yaml
Reserved Capacity Purchases:
  Month 1-3 (Pilot):
    - No reservations
    - Gather usage data
    - Identify patterns
    
  Month 4-6 (Early Growth):
    - Purchase RDS RI (1-year, all upfront)
    - Savings: ~$100/month
    
  Month 7-12 (Scaling):
    - Add Compute Savings Plan
    - Add ElastiCache RIs
    - Combined savings: ~$300/month
    
  Year 2+:
    - 3-year reservations for stable workloads
    - Savings: ~$500/month
```

## 4. Auto-Scaling Configuration

### 4.1 Predictive Scaling

```javascript
// Predictive scaling based on vessel activity patterns
class PredictiveScaler {
  constructor() {
    this.historicalData = new Map();
    this.cloudwatch = new AWS.CloudWatch();
    this.autoscaling = new AWS.ApplicationAutoScaling();
  }
  
  async analyzePatternsAndScale() {
    // Analyze vessel login patterns
    const loginPatterns = await this.getLoginPatterns();
    
    // Vessel maintenance windows typically follow patterns
    const predictions = {
      monday: { peak: '08:00', scale: 1.5 },
      tuesday: { peak: '09:00', scale: 1.3 },
      wednesday: { peak: '10:00', scale: 1.4 },
      thursday: { peak: '09:00', scale: 1.6 },
      friday: { peak: '07:00', scale: 2.0 }, // End of week reports
      saturday: { peak: null, scale: 0.5 },
      sunday: { peak: null, scale: 0.3 }
    };
    
    // Pre-scale 30 minutes before predicted peak
    for (const [day, pattern] of Object.entries(predictions)) {
      if (pattern.peak) {
        await this.scheduleScaling(day, pattern.peak, pattern.scale);
      }
    }
  }
  
  async scheduleScaling(day, peakTime, scaleFactor) {
    const [hour, minute] = peakTime.split(':');
    const preScaleTime = `${parseInt(hour) - 1} ${minute} * * ${day.toUpperCase().slice(0, 3)}`;
    
    await this.autoscaling.putScheduledAction({
      ServiceNamespace: 'ecs',
      ResourceId: 'service/sms-cluster/api-service',
      ScalableDimension: 'ecs:service:DesiredCount',
      ScheduledActionName: `prescale-${day}`,
      Schedule: `cron(${preScaleTime})`,
      ScalableTargetAction: {
        MinCapacity: Math.ceil(2 * scaleFactor),
        MaxCapacity: Math.ceil(10 * scaleFactor)
      }
    }).promise();
  }
}
```

### 4.2 Vessel-Based Scaling

```yaml
Scaling Triggers:
  Per-Vessel Metrics:
    - Active users per vessel: 5
    - Concurrent API calls: 20/vessel
    - Storage per vessel: 50GB
    
  Scaling Formula:
    - API Tasks = CEILING(vessels * 0.2)
    - Worker Tasks = CEILING(vessels * 0.1)
    - Cache Nodes = CEILING(vessels / 20)
    - RDS Size = Based on connections

  Thresholds:
    0-10 vessels:
      - API: 2 tasks
      - Workers: 1 task
      - RDS: t3.medium
      - Cache: 1 node
      
    11-50 vessels:
      - API: 3-10 tasks
      - Workers: 2-5 tasks
      - RDS: r6g.large
      - Cache: 3 nodes
      
    51-100 vessels:
      - API: 10-20 tasks
      - Workers: 5-10 tasks
      - RDS: r6g.xlarge
      - Cache: 3 nodes (clustered)
      
    100+ vessels:
      - API: 20+ tasks
      - Workers: 10+ tasks
      - RDS: r6g.2xlarge + read replicas
      - Cache: 6 nodes (multi-AZ)
```

## 5. Cost Monitoring & Alerts

### 5.1 Automated Cost Tracking

```python
# cost_monitor.py
import boto3
import json
from datetime import datetime, timedelta

class CostMonitor:
    def __init__(self):
        self.ce = boto3.client('costexplorer')
        self.sns = boto3.client('sns')
        self.cw = boto3.client('cloudwatch')
        
    def daily_cost_analysis(self):
        """Analyze daily costs and detect anomalies"""
        
        # Get yesterday's costs
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=1)
        
        response = self.ce.get_cost_and_usage(
            TimePeriod={
                'Start': str(start_date),
                'End': str(end_date)
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ]
        )
        
        daily_cost = 0
        service_costs = {}
        
        for group in response['ResultsByTime'][0]['Groups']:
            service = group['Keys'][0]
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            service_costs[service] = cost
            daily_cost += cost
        
        # Check for anomalies
        avg_daily_cost = self.get_average_daily_cost()
        if daily_cost > avg_daily_cost * 1.3:  # 30% increase
            self.send_cost_alert({
                'type': 'DAILY_COST_SPIKE',
                'daily_cost': daily_cost,
                'average_cost': avg_daily_cost,
                'increase_percentage': ((daily_cost / avg_daily_cost) - 1) * 100,
                'top_services': self.get_top_cost_increases(service_costs)
            })
        
        # Update metrics
        self.update_cost_metrics(daily_cost, service_costs)
        
    def get_top_cost_increases(self, current_costs):
        """Identify services with largest cost increases"""
        
        historical_costs = self.get_historical_service_costs()
        increases = []
        
        for service, current_cost in current_costs.items():
            if service in historical_costs:
                avg_cost = historical_costs[service]
                if current_cost > avg_cost * 1.2:  # 20% increase
                    increases.append({
                        'service': service,
                        'current': current_cost,
                        'average': avg_cost,
                        'increase': ((current_cost / avg_cost) - 1) * 100
                    })
        
        return sorted(increases, key=lambda x: x['increase'], reverse=True)[:5]
    
    def setup_budget_alerts(self):
        """Configure AWS Budgets with alerts"""
        
        budgets_client = boto3.client('budgets')
        
        # Monthly budget with tiered alerts
        budgets_client.create_budget(
            AccountId=boto3.client('sts').get_caller_identity()['Account'],
            Budget={
                'BudgetName': 'SMS-Monthly-Budget',
                'BudgetLimit': {
                    'Amount': '3000',
                    'Unit': 'USD'
                },
                'TimeUnit': 'MONTHLY',
                'BudgetType': 'COST'
            },
            NotificationsWithSubscribers=[
                {
                    'Notification': {
                        'NotificationType': 'ACTUAL',
                        'ComparisonOperator': 'GREATER_THAN',
                        'Threshold': 50,
                        'ThresholdType': 'PERCENTAGE'
                    },
                    'Subscribers': [
                        {
                            'SubscriptionType': 'EMAIL',
                            'Address': 'team@sms-offshore.com'
                        }
                    ]
                },
                {
                    'Notification': {
                        'NotificationType': 'ACTUAL',
                        'ComparisonOperator': 'GREATER_THAN',
                        'Threshold': 80,
                        'ThresholdType': 'PERCENTAGE'
                    },
                    'Subscribers': [
                        {
                            'SubscriptionType': 'SNS',
                            'Address': 'arn:aws:sns:us-east-1:xxx:cost-alerts'
                        }
                    ]
                },
                {
                    'Notification': {
                        'NotificationType': 'FORECASTED',
                        'ComparisonOperator': 'GREATER_THAN',
                        'Threshold': 100,
                        'ThresholdType': 'PERCENTAGE'
                    },
                    'Subscribers': [
                        {
                            'SubscriptionType': 'EMAIL',
                            'Address': 'cto@sms-offshore.com'
                        }
                    ]
                }
            ]
        )
```

### 5.2 Cost Optimization Dashboard

```javascript
// cost-dashboard.js
const createCostDashboard = {
  name: "SMS-Cost-Optimization",
  widgets: [
    {
      type: "number",
      properties: {
        metrics: [
          ["AWS/Billing", "EstimatedCharges", { stat: "Maximum" }]
        ],
        period: 86400,
        stat: "Maximum",
        region: "us-east-1",
        title: "Current Month Costs"
      }
    },
    {
      type: "line",
      properties: {
        metrics: [
          ["CWAgent", "cost_per_vessel", { stat: "Average" }],
          [".", "cost_per_user", { stat: "Average" }]
        ],
        period: 86400,
        stat: "Average",
        region: "us-east-1",
        title: "Unit Economics"
      }
    },
    {
      type: "pie",
      properties: {
        metrics: [
          ["AWS/Billing", "EstimatedCharges", { stat: "Maximum" }]
        ],
        period: 86400,
        stat: "Maximum",
        region: "us-east-1",
        title: "Cost by Service"
      }
    }
  ]
};
```

## 6. Performance vs Cost Trade-offs

### 6.1 Service Tier Configuration

```yaml
Pilot Tier (0-10 vessels):
  Database:
    - Single-AZ t3.medium
    - 7-day backups
    - No read replicas
    Cost: $70/month
    
  Compute:
    - 2 API tasks (512 CPU)
    - 1 Worker task
    - Spot instances for workers
    Cost: $120/month
    
  Performance:
    - 200ms API response
    - 99.5% uptime SLA
    
Growth Tier (11-50 vessels):
  Database:
    - Multi-AZ r6g.large
    - 14-day backups
    - 1 read replica
    Cost: $350/month
    
  Compute:
    - 3-10 API tasks (1024 CPU)
    - 2-5 Worker tasks
    - On-demand instances
    Cost: $400/month
    
  Performance:
    - 150ms API response
    - 99.9% uptime SLA
    
Enterprise Tier (50+ vessels):
  Database:
    - Multi-AZ r6g.xlarge
    - 30-day backups
    - 2 read replicas
    - Cross-region backup
    Cost: $800/month
    
  Compute:
    - 10-20 API tasks (2048 CPU)
    - 5-10 Worker tasks
    - Mixed on-demand/spot
    Cost: $1200/month
    
  Performance:
    - 100ms API response
    - 99.95% uptime SLA
```

### 6.2 Feature-Based Scaling

```javascript
// Feature flags for cost control
const featureFlags = {
  // AI features - expensive, enable per tier
  aiDiagnostics: {
    pilot: false,
    growth: true,
    enterprise: true,
    costPerVessel: 15
  },
  
  // Real-time sync - requires more resources
  realtimeSync: {
    pilot: false,
    growth: true,
    enterprise: true,
    costPerVessel: 10
  },
  
  // Advanced analytics - requires data warehouse
  advancedAnalytics: {
    pilot: false,
    growth: false,
    enterprise: true,
    costPerVessel: 20
  },
  
  // High-res image storage
  highResImages: {
    pilot: false,
    growth: true,
    enterprise: true,
    costPerVessel: 5
  }
};

// Enable features based on tier and ROI
function calculateFeatureROI(vessels, monthlyRevenue) {
  const enabledFeatures = {};
  
  for (const [feature, config] of Object.entries(featureFlags)) {
    const featureCost = config.costPerVessel * vessels;
    const featureROI = (monthlyRevenue * 0.1) / featureCost; // 10% revenue impact
    
    if (featureROI > 2) { // 2x ROI threshold
      enabledFeatures[feature] = true;
    }
  }
  
  return enabledFeatures;
}
```

## 7. Migration Cost Optimization

### 7.1 Phased Migration Strategy

```yaml
Phase 1 - Pilot (Month 1-3):
  Infrastructure:
    - Minimal setup
    - Shared resources
    - No redundancy
  Cost: $500/month
  
Phase 2 - Early Adopters (Month 4-6):
  Infrastructure:
    - Add redundancy
    - Separate environments
    - Basic monitoring
  Cost: $1,000/month
  
Phase 3 - Growth (Month 7-12):
  Infrastructure:
    - Multi-AZ deployment
    - Read replicas
    - Advanced monitoring
  Cost: $2,000/month
  
Phase 4 - Scale (Year 2+):
  Infrastructure:
    - Multi-region
    - Global CDN
    - Full redundancy
  Cost: $3,500+/month
```

### 7.2 Resource Right-Sizing

```python
# right_sizing.py
def analyze_resource_utilization():
    """Identify over-provisioned resources"""
    
    cloudwatch = boto3.client('cloudwatch')
    recommendations = []
    
    # Check ECS task utilization
    ecs_metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/ECS',
        MetricName='CPUUtilization',
        Dimensions=[
            {'Name': 'ServiceName', 'Value': 'sms-api'},
            {'Name': 'ClusterName', 'Value': 'sms-cluster'}
        ],
        StartTime=datetime.now() - timedelta(days=7),
        EndTime=datetime.now(),
        Period=3600,
        Statistics=['Average', 'Maximum']
    )
    
    avg_cpu = sum(p['Average'] for p in ecs_metrics['Datapoints']) / len(ecs_metrics['Datapoints'])
    max_cpu = max(p['Maximum'] for p in ecs_metrics['Datapoints'])
    
    if avg_cpu < 30 and max_cpu < 60:
        recommendations.append({
            'resource': 'ECS Tasks',
            'current': '1024 CPU units',
            'recommended': '512 CPU units',
            'monthly_savings': '$60'
        })
    
    # Check RDS utilization
    rds_metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/RDS',
        MetricName='CPUUtilization',
        Dimensions=[
            {'Name': 'DBInstanceIdentifier', 'Value': 'sms-prod'}
        ],
        StartTime=datetime.now() - timedelta(days=7),
        EndTime=datetime.now(),
        Period=3600,
        Statistics=['Average', 'Maximum']
    )
    
    avg_db_cpu = sum(p['Average'] for p in rds_metrics['Datapoints']) / len(rds_metrics['Datapoints'])
    
    if avg_db_cpu < 20:
        recommendations.append({
            'resource': 'RDS Instance',
            'current': 'r6g.large',
            'recommended': 't3.medium',
            'monthly_savings': '$150'
        })
    
    return recommendations
```

## 8. Waste Reduction

### 8.1 Automated Cleanup

```bash
#!/bin/bash
# cleanup-unused-resources.sh

# Delete unattached EBS volumes
aws ec2 describe-volumes --filters Name=status,Values=available \
  --query 'Volumes[?CreateTime <= `2023-01-01`].VolumeId' \
  --output text | xargs -n1 aws ec2 delete-volume --volume-id

# Delete old snapshots
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[?StartTime <= `2023-01-01`].SnapshotId' \
  --output text | xargs -n1 aws ec2 delete-snapshot --snapshot-id

# Remove unused load balancers
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?State.Code==`active` && length(TargetHealthDescriptions)==`0`].LoadBalancerArn' \
  --output text | xargs -n1 aws elbv2 delete-load-balancer --load-balancer-arn

# Clean up old log groups
aws logs describe-log-groups \
  --query 'logGroups[?creationTime <= `1640995200000`].logGroupName' \
  --output text | xargs -n1 aws logs delete-log-group --log-group-name
```

### 8.2 S3 Lifecycle Automation

```javascript
// s3-lifecycle-manager.js
const optimizeS3Costs = async () => {
  const s3 = new AWS.S3();
  
  // Analyze bucket usage
  const buckets = await s3.listBuckets().promise();
  
  for (const bucket of buckets.Buckets) {
    const metrics = await s3.getBucketMetricsConfiguration({
      Bucket: bucket.Name,
      Id: 'EntireBucket'
    }).promise().catch(() => null);
    
    if (!metrics) continue;
    
    // Get bucket size and access patterns
    const { totalSize, lastAccessed } = await analyzeBucketUsage(bucket.Name);
    
    // Apply intelligent tiering for large, infrequently accessed buckets
    if (totalSize > 100 * 1024 * 1024 * 1024 && // 100GB
        daysSince(lastAccessed) > 30) {
      
      await s3.putBucketLifecycleConfiguration({
        Bucket: bucket.Name,
        LifecycleConfiguration: {
          Rules: [{
            Id: 'IntelligentTiering',
            Status: 'Enabled',
            Transitions: [{
              Days: 0,
              StorageClass: 'INTELLIGENT_TIERING'
            }]
          }]
        }
      }).promise();
      
      console.log(`Enabled Intelligent Tiering for ${bucket.Name}`);
    }
  }
};
```

## 9. Revenue-Aware Scaling

### 9.1 Unit Economics Dashboard

```javascript
// Calculate and track unit economics
class UnitEconomics {
  constructor() {
    this.metrics = {
      revenuePerVessel: 1500,  // $1,500/month
      costPerVessel: 35,       // Target: $35/vessel
      grossMargin: 0.976       // 97.6% margin
    };
  }
  
  calculateBreakEvenPoint() {
    const fixedCosts = 500;  // Base infrastructure
    const variableCostPerVessel = 35;
    const revenuePerVessel = 1500;
    
    const breakEvenVessels = Math.ceil(
      fixedCosts / (revenuePerVessel - variableCostPerVessel)
    );
    
    return {
      vessels: breakEvenVessels,
      revenue: breakEvenVessels * revenuePerVessel,
      costs: fixedCosts + (breakEvenVessels * variableCostPerVessel)
    };
  }
  
  optimizeForMargin(currentVessels) {
    const recommendations = [];
    
    // Calculate current metrics
    const currentRevenue = currentVessels * this.metrics.revenuePerVessel;
    const currentCosts = this.calculateTotalCosts(currentVessels);
    const currentMargin = (currentRevenue - currentCosts) / currentRevenue;
    
    // Recommend optimizations
    if (currentMargin < 0.95) {
      recommendations.push({
        action: 'Enable Reserved Instances',
        impact: '+2% margin',
        implementation: 'immediate'
      });
    }
    
    if (currentVessels > 20 && !this.hasSpotInstances) {
      recommendations.push({
        action: 'Use Spot Instances for workers',
        impact: '+1% margin',
        implementation: '1 week'
      });
    }
    
    return recommendations;
  }
}
```

### 9.2 Scaling Decision Matrix

```yaml
Scaling Decision Framework:
  Triggers:
    Revenue-Based:
      - New customer signed: +$50k ARR
      - Scale infrastructure by 20%
      
    Usage-Based:
      - API response time > 200ms for 5 minutes
      - Auto-scale compute by 50%
      
    Cost-Based:
      - Cost per vessel > $40
      - Implement optimization plan
      
  Optimization Priority:
    1. Reserved Instances (immediate 30% savings)
    2. Spot Instances for workers (50% savings)
    3. S3 Intelligent Tiering (20% savings)
    4. Database right-sizing (40% savings)
    5. CDN optimization (30% savings)
    
  Investment Rules:
    - Infrastructure cost < 3% of revenue
    - Performance investment when NPS < 8
    - Security investment: unlimited
```

## 10. Cost Optimization Checklist

### Monthly Review Checklist

- [ ] Review AWS Cost Explorer for anomalies
- [ ] Check resource utilization (target: 60-80%)
- [ ] Identify unused resources
- [ ] Review Reserved Instance coverage
- [ ] Analyze data transfer costs
- [ ] Check S3 storage classes
- [ ] Review CloudWatch log retention
- [ ] Validate auto-scaling policies
- [ ] Check for idle load balancers
- [ ] Review snapshot retention

### Quarterly Optimization

- [ ] Right-size all instances
- [ ] Review and purchase RIs
- [ ] Optimize S3 lifecycle policies
- [ ] Clean up unused resources
- [ ] Review architectural decisions
- [ ] Update scaling policies
- [ ] Negotiate AWS enterprise discount
- [ ] Review third-party services
- [ ] Optimize database indexes
- [ ] Archive old data

### Annual Planning

- [ ] Renegotiate commitments
- [ ] Plan for next year's growth
- [ ] Review multi-region strategy
- [ ] Evaluate new AWS services
- [ ] Budget allocation review
- [ ] Technology stack review
- [ ] Disaster recovery cost analysis
- [ ] Compliance cost review

## Conclusion

This cost optimization and scaling guide provides a clear path from pilot deployment ($500/month) to enterprise scale ($3,500+/month) while maintaining healthy margins. Key strategies include:

1. **Phased Growth**: Start minimal, scale based on revenue
2. **Reserved Capacity**: Lock in savings as usage stabilizes  
3. **Intelligent Automation**: Let systems optimize themselves
4. **Revenue-Aware Scaling**: Every dollar spent should generate $30+ in revenue
5. **Continuous Optimization**: Monthly reviews prevent cost creep

Following these guidelines ensures the SMS platform remains profitable at any scale while delivering exceptional performance to maritime customers.