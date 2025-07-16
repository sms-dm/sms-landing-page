# SMS Manager Operations & Engineer Oversight Guide

## Table of Contents
1. [Overview](#overview)
2. [Manager Dashboard](#manager-dashboard)
3. [Real-time Monitoring](#real-time-monitoring)
4. [Approval Workflows](#approval-workflows)
5. [Report Generation & Analytics](#report-generation--analytics)
6. [Team Management](#team-management)
7. [Budget Tracking](#budget-tracking)
8. [Compliance Monitoring](#compliance-monitoring)
9. [Verification Schedules](#verification-schedules)
10. [HSE Board Management](#hse-board-management)
11. [Communication with Engineers](#communication-with-engineers)
12. [Export/Import Capabilities](#exportimport-capabilities)
13. [Quality Score Tracking](#quality-score-tracking)
14. [Alert Configurations](#alert-configurations)
15. [Performance Metrics](#performance-metrics)
16. [Portal Integration](#portal-integration)

## Overview

The SMS platform provides comprehensive oversight capabilities for managers to monitor and control all aspects of marine maintenance operations. The system is designed with a two-portal architecture:

- **Onboarding Portal**: Used for initial equipment setup and verification
- **Maintenance Portal**: Ongoing operations, fault management, and maintenance tracking

Managers have elevated permissions that allow them to oversee engineer activities, approve critical decisions, and ensure compliance across the fleet.

## Manager Dashboard

### Main Dashboard Components

The manager dashboard (`/home/sms/repos/SMS/sms-app/frontend/src/pages/ManagerDashboard.tsx`) provides:

1. **Performance Overview Cards**
   - Equipment Uptime (Fleet average)
   - Average MTTR (Mean Time To Repair)
   - Critical Faults Count
   - Inventory Value

2. **Quick Access Sections**
   - Equipment Management
   - Maintenance Calendar
   - Inventory Management
   - Records & Reports
   - Team Management
   - Analytics

3. **Recent Activity Feed**
   - Real-time fault reports
   - Inventory alerts
   - Status updates with timestamps

### Dashboard Features
```javascript
// Key statistics displayed
{
  activeFaults: { critical: 0, minor: 0, resolved: 0 },
  maintenance: { scheduled: 0, overdue: 0, completed: 0 },
  inventory: { lowStock: 0, pendingOrders: 0, totalValue: 0 },
  performance: { mttr: 0, uptime: 0, efficiency: 0 }
}
```

## Real-time Monitoring

### Live Data Updates
1. **Equipment Status**
   - Real-time operational status
   - Fault detection and alerts
   - Performance degradation indicators

2. **Team Activity Tracking**
   - Active technicians on duty
   - Current work orders in progress
   - Location-based activity monitoring

3. **Vessel Operations**
   - Cross-vessel comparisons
   - Department-specific views
   - Critical system monitoring

### Monitoring Interfaces
- **Team Chat Widget**: Real-time communication monitoring
- **Activity Feeds**: Latest updates from all departments
- **Status Indicators**: Visual cues for system health

## Approval Workflows

### Parts Approval Process
1. **Engineer Request**
   - Engineer identifies part requirement
   - Submits request with justification
   - System logs request with timestamp

2. **Manager Review**
   - Notification appears in manager dashboard
   - Review part specifications and cost
   - Check inventory availability
   - Approve/Reject with comments

3. **Automatic Actions**
   - Approved parts added to purchase orders
   - Inventory updated upon approval
   - Engineer notified of decision

### Work Order Approvals
```javascript
// Approval workflow states
{
  pending: "Awaiting manager review",
  approved: "Work authorized to proceed",
  rejected: "Requires revision",
  in_progress: "Work underway",
  completed: "Work finished, pending verification"
}
```

### Vessel Export Approval (Onboarding Portal)
The approval workflow page (`/SMS-Onboarding-Unified/frontend/src/features/manager/pages/ApprovalWorkflowPage.tsx`) enables:

1. **Equipment Review**
   - Total equipment count per vessel
   - Approved/Pending/Rejected items
   - Progress visualization

2. **Export Preview**
   - Vessel information summary
   - Equipment and parts count
   - Document and photo statistics

3. **Export to Maintenance**
   - One-click transfer to maintenance portal
   - Automatic onboarding completion
   - Data integrity verification

## Report Generation & Analytics

### Analytics Dashboard Features
The analytics page (`/sms-app/frontend/src/pages/Analytics.tsx`) provides:

1. **Key Performance Indicators**
   - Fleet uptime percentage
   - Average MTTR across vessels
   - Active fault distribution
   - Monthly maintenance costs

2. **Visualization Tools**
   - Vessel uptime comparison (bar charts)
   - Fault distribution (pie charts)
   - Trend analysis (line graphs)
   - Performance tables with drill-down

3. **Export Capabilities**
   - CSV export for all data
   - Date range filtering
   - Vessel-specific reports
   - Custom report generation

### Report Types
- **Operational Reports**: Equipment performance, uptime statistics
- **Financial Reports**: Maintenance costs, parts inventory value
- **Compliance Reports**: Regulatory adherence, certification status
- **Team Reports**: Technician performance, work order completion

## Team Management

### Team Overview Features
1. **Technician Tracking**
   - Active/inactive status
   - Current assignments
   - Performance scores
   - Certification status

2. **Department Management**
   - Mechanical team oversight
   - Electrical team monitoring
   - HSE compliance tracking
   - Cross-department coordination

3. **Performance Metrics**
   - Individual technician scores
   - Team efficiency ratings
   - Response time tracking
   - Quality of work assessments

### Team Communication
The Team Chat system enables:
- Department-specific channels
- Direct messaging capabilities
- File sharing for technical documents
- Real-time presence indicators

## Budget Tracking

### Financial Oversight (Hidden Markup System)
The system implements intelligent budget tracking without revealing the 20% markup:

1. **Cost Display**
   - Engineers see base costs
   - Managers see actual costs (internally)
   - Reports show appropriate values based on viewer

2. **Budget Categories**
   - Parts and materials
   - Labor costs
   - Emergency repairs
   - Scheduled maintenance

3. **Cost Analysis**
   - Monthly spending trends
   - Department-wise allocation
   - Vessel-specific budgets
   - Cost optimization opportunities

## Compliance Monitoring

### Regulatory Compliance
1. **Certification Tracking**
   - Equipment certifications
   - Personnel qualifications
   - Vessel compliance status
   - Upcoming renewals

2. **Audit Trails**
   - All actions logged with timestamps
   - User accountability
   - Change history tracking
   - Compliance reporting

3. **Standards Adherence**
   - ISM compliance
   - MARPOL requirements
   - Classification society rules
   - Company-specific standards

## Verification Schedules

### Verification Dashboard (`VerificationDashboard.tsx`)
Comprehensive tracking of equipment verification schedules:

1. **Status Overview**
   - Total equipment count
   - Overdue verifications (critical alerts)
   - Due soon items (7-day window)
   - Recent verifications completed

2. **Quality Scoring**
   - Average data quality score
   - Quality degradation indicators
   - Trend analysis over time

3. **Automated Alerts**
   - Overdue notifications
   - Upcoming verification reminders
   - Quality score warnings

### Verification Management
```javascript
// Verification states and actions
{
  overdueEquipment: [
    {
      name: "Equipment Name",
      daysOverdue: 15,
      qualityScore: 75,
      degradedScore: 65,
      action: "Verify Now"
    }
  ],
  dueSoonEquipment: [
    {
      name: "Equipment Name",
      daysUntilDue: 3,
      nextVerificationDate: "2024-01-20",
      action: "Schedule"
    }
  ]
}
```

## HSE Board Management

### HSE Dashboard Components (`HSEBoard.tsx`)
1. **Safety Metrics**
   - Days without incident counter
   - Active safety alerts
   - Pending acknowledgments
   - Compliance rate percentage

2. **Update Management**
   - Create fleet-wide or vessel-specific updates
   - Severity levels (critical, high, medium, low, info)
   - Acknowledgment tracking
   - Expiration management

3. **Permission-based Access**
   - HSE Managers: Fleet-wide updates
   - HSE Officers: Vessel-specific updates
   - Automatic scope filtering

### HSE Update Types
- Safety alerts
- Procedure updates
- Incident reports
- Best practices
- Regulatory updates
- Training notifications

## Communication with Engineers

### Communication Channels
1. **Team Chat System**
   - Real-time messaging
   - Department channels
   - File attachments
   - Typing indicators
   - Online status tracking

2. **Work Order Comments**
   - Task-specific discussions
   - Technical clarifications
   - Progress updates
   - Issue escalation

3. **Notification System**
   - Push notifications for critical events
   - Email alerts for approvals
   - In-app notification center
   - Customizable alert preferences

### Manager-Engineer Interactions
- **Direct Oversight**: View engineer activities in real-time
- **Task Assignment**: Allocate work orders to specific technicians
- **Performance Feedback**: Provide ratings and comments
- **Resource Allocation**: Assign tools and parts access

## Export/Import Capabilities

### Data Export Features
1. **Records Export**
   - CSV format for all records
   - Filtered exports by date/type/status
   - Bulk data downloads
   - Scheduled report generation

2. **Analytics Export**
   - Performance metrics
   - Cost analysis reports
   - Compliance documentation
   - Team performance data

3. **Integration Exports**
   - ERP system compatibility
   - Accounting software formats
   - Regulatory reporting templates
   - Custom API endpoints

### Import Capabilities
- Equipment data bulk upload
- Parts inventory import
- Historical records migration
- User data synchronization

## Quality Score Tracking

### Quality Metrics System
1. **Equipment Data Quality**
   - Completeness of information
   - Accuracy of specifications
   - Photo documentation quality
   - Maintenance history depth

2. **Score Calculation**
   ```javascript
   qualityScore = {
     dataCompleteness: 40%,
     documentationQuality: 30%,
     maintenanceHistory: 20%,
     verificationTimeliness: 10%
   }
   ```

3. **Quality Improvement**
   - Identify low-scoring equipment
   - Track improvement over time
   - Department comparisons
   - Best practice identification

## Alert Configurations

### Alert Management System
1. **Alert Types**
   - Critical fault notifications
   - Maintenance due reminders
   - Low inventory warnings
   - Compliance deadlines
   - Team performance alerts

2. **Configuration Options**
   - Severity thresholds
   - Notification channels (email, SMS, in-app)
   - Escalation rules
   - Quiet hours settings

3. **Alert Dashboard**
   - Active alerts overview
   - Alert history
   - Response time tracking
   - Resolution status

### Custom Alert Rules
```javascript
// Example alert configuration
{
  alertType: "equipment_fault",
  severity: "critical",
  conditions: {
    equipmentType: ["critical_machinery"],
    faultSeverity: ["high", "critical"],
    responseTime: "<30_minutes"
  },
  notifications: {
    immediate: ["manager", "hse_officer"],
    escalation: {
      after: "1_hour",
      to: ["fleet_manager", "shore_support"]
    }
  }
}
```

## Performance Metrics

### Key Performance Indicators
1. **Operational Metrics**
   - Equipment uptime percentage
   - Mean time between failures (MTBF)
   - Mean time to repair (MTTR)
   - First-time fix rate

2. **Financial Metrics**
   - Maintenance cost per vessel
   - Parts inventory turnover
   - Budget variance analysis
   - Cost per operational hour

3. **Team Metrics**
   - Work order completion rate
   - Average response time
   - Quality scores by technician
   - Training compliance rates

### Performance Dashboards
- Real-time KPI tracking
- Historical trend analysis
- Predictive maintenance indicators
- Benchmarking across vessels

## Portal Integration

### Seamless Data Flow
1. **Onboarding to Maintenance**
   - Equipment data transfer
   - Documentation migration
   - Verification history
   - Parts inventory sync

2. **Bi-directional Updates**
   - Maintenance history feeds back
   - Equipment status synchronization
   - Cost tracking across portals
   - User permissions sync

3. **Integration Points**
   ```javascript
   // Portal integration workflow
   {
     onboarding: {
       equipmentSetup: "Complete",
       verification: "Approved",
       documentation: "Uploaded"
     },
     transfer: {
       method: "API",
       validation: "Checksum",
       status: "Verified"
     },
     maintenance: {
       dataReceived: "Confirmed",
       systemsActive: "Operational",
       historyLinked: "Connected"
     }
   }
   ```

### Manager Impact on Engineer Views

1. **Permission Changes**
   - Managers can modify engineer access levels
   - Real-time permission updates
   - Department-specific restrictions
   - Temporary access grants

2. **Work Order Updates**
   - Manager comments appear instantly
   - Priority changes reflect immediately
   - Resource allocations update live
   - Status changes trigger notifications

3. **Dashboard Customization**
   - Managers can configure engineer dashboards
   - Set default views per role
   - Control information visibility
   - Enforce compliance displays

## Best Practices for Managers

### Daily Operations
1. **Morning Review**
   - Check overnight alerts
   - Review critical faults
   - Assess team availability
   - Plan daily priorities

2. **Continuous Monitoring**
   - Keep dashboard open
   - Enable push notifications
   - Set up custom alerts
   - Monitor team chat

3. **End-of-Day Analysis**
   - Review completion rates
   - Check pending approvals
   - Analyze daily costs
   - Plan next day activities

### Weekly Management Tasks
- Performance report generation
- Team meeting preparation
- Compliance check review
- Budget analysis
- Quality score assessment

### Monthly Responsibilities
- Comprehensive analytics review
- Portal data reconciliation
- Team performance evaluations
- Compliance reporting
- Strategic planning updates

## Troubleshooting Common Issues

### Access Problems
- Verify manager role assignment
- Check vessel permissions
- Confirm department access
- Review portal connectivity

### Data Synchronization
- Manual sync options available
- Conflict resolution procedures
- Backup data protocols
- Recovery mechanisms

### Performance Optimization
- Clear browser cache regularly
- Use recommended browsers
- Optimize notification settings
- Manage concurrent sessions

## Security Considerations

### Access Control
- Role-based permissions
- Multi-factor authentication
- Session management
- Audit trail maintenance

### Data Protection
- Encrypted communications
- Secure data storage
- Regular backups
- Access logging

### Compliance Requirements
- GDPR considerations
- Maritime data regulations
- Company privacy policies
- International standards

## Conclusion

The SMS platform provides managers with comprehensive tools to oversee all aspects of marine maintenance operations. Through intelligent integration between the onboarding and maintenance portals, real-time monitoring capabilities, and sophisticated approval workflows, managers can ensure efficient operations while maintaining compliance and controlling costs.

The system's design ensures that managers have complete visibility into engineer activities while providing the necessary controls to maintain quality, safety, and efficiency across the fleet. Regular use of these tools and adherence to best practices will maximize the platform's value and ensure smooth operations.

For technical support or additional training, contact the SMS support team at support@smartmarinesystems.com.