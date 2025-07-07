#!/usr/bin/env node

// Preview all SMS email templates
const templates = {
  welcome: {
    subject: 'Welcome to Smart Maintenance Systems',
    preview: `
Dear {{firstName}},

Welcome to Smart Maintenance Systems! Your company {{companyName}} has been successfully onboarded.

You can now access the maintenance portal at:
{{loginUrl}}

Your login credentials:
Username: {{email}}
Password: [Provided separately]

Get started by:
1. Logging into the portal
2. Exploring your vessel dashboard
3. Checking equipment status
4. Reviewing maintenance schedules

Need help? Contact support@sms-system.com

Best regards,
The SMS Team
    `
  },
  
  'activation-code': {
    subject: 'Your SMS Activation Code',
    preview: `
Your Smart Maintenance Systems Activation Code

Company: {{companyName}}
Activation Code: {{code}}

This code expires in {{expiresIn}}.

To activate your system:
1. Go to {{activationUrl}}
2. Enter the code above
3. Complete the setup process

Questions? Contact your sales representative.

Best regards,
The SMS Team
    `
  },
  
  'maintenance-reminder': {
    subject: 'Maintenance Due: {{equipmentName}}',
    preview: `
MAINTENANCE REMINDER

Vessel: {{vesselName}}
Equipment: {{equipmentName}}
Maintenance Type: {{maintenanceType}}
Due Date: {{dueDate}}
Last Maintenance: {{lastMaintenance}}

⚠️ This equipment requires attention within the scheduled timeframe.

Access the maintenance portal to:
- View detailed maintenance procedures
- Log maintenance completion
- Order required parts
- Update maintenance records

Portal: {{portalUrl}}

Stay compliant, stay safe!
The SMS Team
    `
  },
  
  'hse-alert': {
    subject: '🚨 HSE Alert - {{priority}}: {{title}}',
    preview: `
HEALTH, SAFETY & ENVIRONMENT ALERT

Priority: {{priority}}
Vessel: {{vesselName}}
Subject: {{title}}

{{message}}

IMMEDIATE ACTION REQUIRED:
1. Read and understand this safety update
2. Brief your team members
3. Acknowledge receipt at: {{acknowledgeUrl}}

This is a mandatory safety communication.

Stay safe,
HSE Department
    `
  },
  
  'fault-alert': {
    subject: '⚠️ Fault Reported: {{equipmentName}}',
    preview: `
FAULT NOTIFICATION

Vessel: {{vesselName}}
Equipment: {{equipmentName}}
Severity: {{severity}}
Reported By: {{reportedBy}}
Time: {{timestamp}}

Fault Description:
{{description}}

Immediate Actions Taken:
{{immediateActions}}

View full details and diagnostic steps:
{{faultUrl}}

Respond promptly to minimize downtime.

Technical Support Team
    `
  },
  
  'equipment-approved': {
    subject: '✅ Equipment Approved - {{vesselName}}',
    preview: `
EQUIPMENT APPROVAL NOTIFICATION

Good news! The following equipment has been approved:

Vessel: {{vesselName}}
Equipment Count: {{equipmentCount}}
Approved By: {{approverName}}
Date: {{approvalDate}}

The approved equipment data has been synchronized to the maintenance portal.
Your team can now:
- Access equipment details
- Schedule maintenance
- Track performance
- Order parts

Access your equipment at: {{portalUrl}}

Best regards,
The SMS Team
    `
  },
  
  'weekly-summary': {
    subject: 'Weekly Summary - {{vesselName}} ({{weekDate}})',
    preview: `
WEEKLY MAINTENANCE SUMMARY

Vessel: {{vesselName}}
Week: {{weekDate}}

📊 Key Metrics:
- Maintenance Completed: {{maintenanceCompleted}}
- Faults Resolved: {{faultsResolved}}
- Parts Ordered: {{partsOrdered}}
- Compliance Score: {{complianceScore}}%

🔧 Upcoming Maintenance:
{{upcomingList}}

⚠️ Overdue Items:
{{overdueList}}

📈 Trends:
- Equipment Health: {{healthTrend}}
- Team Performance: {{performanceTrend}}

View detailed reports: {{reportUrl}}

Have a safe week ahead!
The SMS Team
    `
  },
  
  'payment-confirmation': {
    subject: 'Payment Received - Invoice #{{invoiceNumber}}',
    preview: `
PAYMENT CONFIRMATION

Thank you for your payment!

Invoice Number: #{{invoiceNumber}}
Amount: {{amount}}
Payment Date: {{paymentDate}}
Payment Method: {{paymentMethod}}

Service Period: {{servicePeriod}}
Vessels Covered: {{vesselCount}}

Your service continues uninterrupted.
Download invoice: {{invoiceUrl}}

Thank you for choosing Smart Maintenance Systems.

Billing Department
SMS System
    `
  }
};

console.log('📧 SMS Email Templates Preview');
console.log('==============================\n');

Object.entries(templates).forEach(([name, template]) => {
  console.log(`📋 Template: ${name}`);
  console.log(`📌 Subject: ${template.subject}`);
  console.log('---Preview---');
  console.log(template.preview);
  console.log('\n' + '='.repeat(60) + '\n');
});

console.log('💡 Template Variables:');
console.log('   {{variable}} - Will be replaced with actual data');
console.log('   All templates are responsive HTML in production\n');

console.log('🚀 To test with real data:');
console.log('   1. Run: ./setup-gmail.sh');
console.log('   2. Then: node test-email-system.js');
console.log('   3. Check your inbox!\n');