# SMS Parts Inventory & Revenue System

## Overview
This system implements the core revenue model for SMS - a hidden 20% markup on all parts orders. The system ensures SMS gets notified FIRST about low stock situations and controls all purchase approvals.

## Key Features

### 1. **Parts Inventory Management**
- Track parts across all vessels
- Monitor stock levels in real-time
- Automatic low stock detection
- Lead time tracking for reordering

### 2. **Revenue Generation (Hidden 20% Markup)**
- All parts have a 20% markup automatically applied
- Markup is hidden from vessel operators
- SMS controls all pricing and approvals
- Revenue tracking and reporting

### 3. **Low Stock Detection & Notifications**
- Background job checks stock levels hourly
- SMS admins notified FIRST (before vessels)
- 30-minute delay before vessel notification
- Ensures SMS can prepare quotes and control narrative

### 4. **Order Approval Workflow**
- All orders must go through SMS approval
- No direct supplier ordering allowed
- SMS applies markup during approval
- Complete audit trail of all orders

### 5. **Invoice Generation**
- Automatic invoice creation on order approval
- PDF generation for professional invoices
- Markup included but not itemized
- Payment tracking and overdue alerts

## Database Schema

### Core Tables:
- `parts_inventory` - Parts catalog with stock levels
- `purchase_orders` - Order tracking with SMS markup
- `purchase_order_items` - Individual line items
- `inventory_transactions` - Stock movement audit trail
- `low_stock_alerts` - Alert tracking and status
- `sms_notifications` - SMS admin notifications
- `invoices` - Invoice generation and tracking

## API Endpoints

### Inventory Management
- `GET /api/inventory/vessels/:vesselId/parts` - Get vessel parts inventory
- `GET /api/inventory/parts/:partId` - Get part details
- `PUT /api/inventory/parts/:partId` - Update part information
- `POST /api/inventory/parts/:partId/transactions` - Record stock transaction

### Purchase Orders
- `POST /api/inventory/purchase-requests` - Create purchase request (vessels)
- `GET /api/inventory/admin/purchase-orders` - Get all orders (SMS admin)
- `PUT /api/inventory/admin/purchase-orders/:orderId/status` - Approve/reject order
- `GET /api/inventory/purchase-orders/:orderId` - Get order details

### Invoices
- `GET /api/admin/invoices` - Get all invoices (SMS admin)
- `GET /api/vessels/:vesselId/invoices` - Get vessel invoices
- `GET /api/invoices/:invoiceId` - Get invoice details
- `POST /api/invoices/:invoiceId/send` - Send invoice
- `GET /api/invoices/:invoiceId/download` - Download PDF

### Alerts & Reports
- `GET /api/inventory/alerts/low-stock` - Get low stock alerts
- `GET /api/admin/revenue-report` - Revenue report (SMS admin only)
- `POST /api/inventory/admin/check-low-stock` - Manual stock check

## Revenue Model Implementation

### Markup Application:
1. Base cost stored in `parts_inventory.unit_cost`
2. 20% markup applied in `purchase_orders.sms_markup_percentage`
3. Markup amount calculated in `purchase_orders.sms_markup_amount`
4. Customer sees only final price (`unit_price` = `unit_cost` * 1.20)

### Revenue Tracking:
- Monthly revenue reports generated automatically
- Breakdown by vessel, company, and time period
- Projected annual revenue calculations
- Hidden from vessel operators

## Scheduled Jobs

### Hourly (8 AM - 6 PM):
- Low stock detection
- SMS admin notifications

### Daily (9 AM):
- Check for overdue invoices
- Send payment reminders

### Monthly (1st of month):
- Generate revenue reports
- Email to SMS executives

## Security Features

1. **Role-Based Access**:
   - SMS admins see full markup details
   - Vessel users see only final prices
   - Markup percentage never exposed in API

2. **Notification Priority**:
   - SMS always notified first
   - 30-minute delay for vessel notifications
   - Allows SMS to control communication

3. **Audit Trail**:
   - All transactions logged
   - User actions tracked
   - Complete order history

## Testing

### Run Migration:
```bash
node run-inventory-migration.js
```

### Test System:
```bash
node test-inventory-system.js
```

### Manual Testing:
1. Create parts with stock below minimum
2. Run low stock check
3. Verify SMS notification created
4. Create purchase request as vessel user
5. Approve order as SMS admin
6. Check invoice generation

## Revenue Projections

Based on 20% markup:
- Average order: $1,000 base = $200 revenue
- 25 vessels × 10 orders/month = 250 orders
- Monthly revenue: $50,000
- Annual revenue: $600,000

## Important Notes

⚠️ **CONFIDENTIAL**: The 20% markup is proprietary information and must NEVER be exposed to vessel operators or in any customer-facing documentation.

🔒 **Security**: All markup-related fields are hidden from non-admin API responses.

💰 **Revenue Protection**: The system is designed to ensure all parts orders go through SMS, protecting the revenue stream.