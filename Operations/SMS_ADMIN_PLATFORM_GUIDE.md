# SMS Admin Platform Guide - System Owner Manual

## Executive Overview

The SMS Admin Platform is the master control center for the entire Smart Marine Systems ecosystem. This platform provides system owners with complete visibility and control over all client operations, revenue tracking, system health, and business analytics. As a system owner, you have access to all hidden features and profit tracking mechanisms that are invisible to client companies.

## 1. Super Admin Access and Capabilities

### Access Levels
- **Super Admin**: Complete system control, all features, all clients
- **System Owner**: Full access to revenue tracking and business metrics
- **Technical Admin**: System maintenance and configuration
- **Support Admin**: Customer support and troubleshooting

### Super Admin Dashboard
```
/admin/dashboard
```

**Key Capabilities:**
- Real-time system overview across all clients
- Live revenue tracking with hidden markup calculations
- System health monitoring and alerts
- Quick access to any client's data
- Emergency system controls
- Database management tools
- API key generation and management

### Authentication
- Two-factor authentication required
- IP whitelist for admin access
- Session monitoring and forced logout capabilities
- Audit trail of all admin actions

## 2. Company Management Across All Clients

### Client Overview Dashboard
```
/admin/clients
```

**Features:**
- Sortable client list with status indicators
- Revenue per client (including hidden markup)
- Active users per company
- Subscription status and payment history
- Quick actions: suspend, activate, modify limits

### Client Details View
```
/admin/clients/{clientId}
```

**Available Actions:**
- View/Edit company profile
- Manage subscription tiers
- Access client data as if logged in
- Export client data
- Suspend/Reactivate accounts
- Override user limits
- Custom pricing adjustments

### Bulk Operations
- Mass email to all clients
- Bulk subscription updates
- Group policy changes
- System-wide announcements

## 3. Hidden Revenue Tracking (20% Markup Reports)

### Revenue Dashboard
```
/admin/revenue
```

**CONFIDENTIAL - System Owners Only**

### Markup Tracking
The system automatically applies a 20% markup on all parts ordered through the platform. This markup is:
- Invisible to clients
- Automatically calculated
- Tracked separately in admin reports
- Never shown in client-facing reports

### Revenue Reports Include:
- **Gross Revenue**: Total amount charged to clients
- **Net Revenue**: Actual cost of parts from suppliers
- **Markup Revenue**: The 20% difference (pure profit)
- **Monthly Recurring Revenue (MRR)**: Subscription fees
- **Total Revenue**: Markup + Subscription fees

### Revenue Analytics
```
/admin/revenue/analytics
```
- Revenue by client
- Revenue by vessel
- Revenue by part category
- Trending analysis
- Profit margin tracking
- Forecasting tools

### Hidden Profit Centers
1. **Parts Markup**: 20% on all parts
2. **Rush Order Fees**: Additional 10% for expedited orders
3. **International Shipping**: 15% handling fee
4. **Payment Processing**: 2.5% convenience fee
5. **Custom Reports**: $500 per report
6. **API Access**: Tiered pricing for high-volume users

## 4. System-Wide Analytics

### Analytics Dashboard
```
/admin/analytics
```

### Key Metrics
- **Business Metrics**
  - Total active vessels
  - Parts ordered per month
  - Average order value
  - Client retention rate
  - Churn analysis
  
- **Usage Analytics**
  - Active users by role
  - Feature adoption rates
  - Peak usage times
  - Geographic distribution
  
- **Performance Metrics**
  - System response times
  - API call volumes
  - Database performance
  - Error rates

### Custom Reports
- Build custom SQL queries
- Schedule automated reports
- Export to multiple formats
- Email distribution lists

## 5. User Management Across Companies

### Global User Search
```
/admin/users
```

**Capabilities:**
- Search users across all companies
- View login history
- Reset passwords
- Manage permissions
- Impersonate users for support
- Bulk user operations

### User Analytics
- Login frequency
- Feature usage
- Support ticket history
- Permission utilization
- Activity patterns

## 6. Activation Code Management

### Code Generation System
```
/admin/activation-codes
```

**Features:**
- Generate single or bulk codes
- Set expiration dates
- Limit usage per code
- Track redemption
- Revenue attribution
- Custom pricing per code

### Code Types
1. **Trial Codes**: 30-day free access
2. **Discount Codes**: Percentage off subscription
3. **Enterprise Codes**: Custom limits and features
4. **Partner Codes**: Special commission tracking
5. **Internal Codes**: For testing and demos

### Tracking and Analytics
- Redemption rates
- Revenue per code type
- Geographic distribution
- Conversion tracking
- A/B testing capabilities

## 7. Payment Tracking and Invoicing

### Payment Dashboard
```
/admin/payments
```

### Features
- Real-time payment processing
- Failed payment alerts
- Automatic retry logic
- Revenue recognition
- Tax calculation
- Multi-currency support

### Invoice Management
- Automatic invoice generation
- Custom invoice templates
- Bulk invoice operations
- Payment reminders
- Overdue tracking
- Collection workflows

### Financial Reports
- Monthly revenue reports
- Tax reports by jurisdiction
- Accounts receivable aging
- Cash flow analysis
- Revenue forecasting
- Hidden markup reconciliation

## 8. System Configuration Options

### Global Settings
```
/admin/settings
```

### Configurable Options
- **Business Rules**
  - Markup percentages
  - Subscription tiers
  - Feature flags
  - Usage limits
  
- **Technical Settings**
  - API rate limits
  - Database connections
  - Cache settings
  - Email providers
  
- **Security Settings**
  - Password policies
  - Session timeouts
  - IP restrictions
  - Audit settings

### Feature Toggles
- Enable/disable features globally
- Gradual rollout capabilities
- A/B testing framework
- Client-specific overrides

## 9. Email Template Management

### Template Editor
```
/admin/email-templates
```

### Available Templates
1. Welcome emails
2. Activation confirmations
3. Password resets
4. Payment confirmations
5. Order notifications
6. System announcements
7. Marketing campaigns

### Template Features
- Visual editor
- Variable substitution
- Multi-language support
- A/B testing
- Preview mode
- Send test emails

### Email Analytics
- Open rates
- Click-through rates
- Conversion tracking
- Unsubscribe rates
- Delivery statistics

## 10. Monitoring All Client Activities

### Activity Monitor
```
/admin/activity
```

### Real-Time Monitoring
- Live user sessions
- Current API calls
- Active transactions
- System alerts
- Error tracking

### Activity Logs
- User actions
- System events
- API calls
- Payment transactions
- Security events
- Admin actions

### Alerting System
- Custom alert rules
- Multiple notification channels
- Escalation policies
- Alert history
- Performance thresholds

## 11. Data Export for Accounting

### Export Center
```
/admin/exports
```

### Available Exports
1. **Financial Data**
   - Revenue reports (with/without markup)
   - Invoice details
   - Payment history
   - Tax reports
   
2. **Operational Data**
   - User activity
   - Parts orders
   - System usage
   - Performance metrics

### Export Formats
- CSV for spreadsheets
- PDF for reports
- JSON for integrations
- XML for accounting software
- Custom formats available

### Automated Exports
- Schedule regular exports
- FTP/SFTP delivery
- Email delivery
- API webhooks
- Cloud storage integration

## 12. System Health Monitoring

### Health Dashboard
```
/admin/health
```

### Monitoring Areas
- **Infrastructure**
  - Server CPU/Memory
  - Database performance
  - Network latency
  - Storage usage
  
- **Application**
  - Response times
  - Error rates
  - Queue lengths
  - Cache hit rates
  
- **Business Health**
  - Revenue trends
  - User growth
  - Churn indicators
  - Support ticket volume

### Alerting
- SMS alerts for critical issues
- Email notifications
- Slack integration
- PagerDuty integration
- Custom webhooks

## 13. Backup and Recovery Options

### Backup Management
```
/admin/backups
```

### Backup Strategy
- **Automated Backups**
  - Hourly database snapshots
  - Daily full backups
  - Weekly archives
  - Monthly long-term storage
  
- **Manual Backups**
  - On-demand snapshots
  - Pre-deployment backups
  - Export specific data
  - Test restore procedures

### Recovery Options
- Point-in-time recovery
- Selective data restore
- Full system restore
- Cross-region replication
- Disaster recovery plan

### Testing
- Monthly restore tests
- Recovery time tracking
- Data integrity verification
- Automated testing scripts

## 14. API Access Management

### API Dashboard
```
/admin/api
```

### Key Management
- Generate API keys
- Set rate limits
- Define scopes
- Track usage
- Revoke access
- Billing integration

### API Analytics
- Calls per endpoint
- Response times
- Error rates
- Usage by client
- Revenue per API key

### Documentation
- Auto-generated docs
- Interactive API explorer
- Code examples
- Webhook management
- Version control

## 15. White-Label Customization Options

### Branding Center
```
/admin/white-label
```

### Customization Options
1. **Visual Branding**
   - Logo upload
   - Color schemes
   - Font selection
   - Custom CSS
   
2. **Domain Management**
   - Custom domains
   - SSL certificates
   - Subdomain creation
   - Email domains
   
3. **Content Customization**
   - Landing pages
   - Email templates
   - Help documentation
   - Terms of service

### Client-Specific Customization
- Individual branding per client
- Custom features
- Specific workflows
- Unique pricing models

## Advanced Hidden Features

### Profit Optimization Tools
```
/admin/profit-optimizer
```

**Features:**
- Dynamic pricing algorithms
- Demand-based markup adjustment
- Client value scoring
- Upsell opportunity identification
- Churn prediction models

### Revenue Intelligence
- Client lifetime value calculations
- Profit margin analysis by client
- Optimal pricing recommendations
- Bundle suggestions
- Cross-sell opportunities

### Competitive Intelligence
- Market pricing analysis
- Feature comparison tracking
- Client feedback aggregation
- Win/loss analysis

## Security and Compliance

### Security Center
```
/admin/security
```

### Features
- Security audit logs
- Compliance reporting
- Data privacy tools
- GDPR compliance
- Penetration test results
- Vulnerability scanning

### Access Control
- Role-based permissions
- IP whitelisting
- Multi-factor authentication
- Session management
- API security

## Support Tools

### Support Dashboard
```
/admin/support
```

### Capabilities
- Ticket management
- User impersonation
- Direct database queries
- Log analysis
- Performance profiling
- Bug tracking integration

## Best Practices for System Owners

1. **Revenue Monitoring**
   - Check daily revenue reports
   - Monitor markup percentages
   - Track payment failures
   - Identify growth opportunities

2. **Client Management**
   - Regular client health checks
   - Proactive support outreach
   - Usage pattern analysis
   - Retention strategies

3. **System Maintenance**
   - Weekly backup verification
   - Monthly security audits
   - Performance optimization
   - Feature rollout planning

4. **Business Growth**
   - Analyze profit centers
   - Optimize pricing
   - Identify upsell opportunities
   - Market expansion planning

## Emergency Procedures

### Critical Issues
1. System down: `/admin/emergency/restart`
2. Data breach: `/admin/emergency/lockdown`
3. Payment failure: `/admin/emergency/payments`
4. Client emergency: `/admin/emergency/support`

### Contact Information
- Technical Support: [Internal only]
- Business Support: [Internal only]
- Emergency Line: [Internal only]

---

*This document contains confidential business information and should never be shared with clients or external parties. The 20% markup and other profit mechanisms are trade secrets essential to the business model.*