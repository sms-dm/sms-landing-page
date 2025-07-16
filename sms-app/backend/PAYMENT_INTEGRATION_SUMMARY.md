# Payment Integration and Activation Code System

## Overview
A complete payment integration and activation code generation system has been implemented for the SMS portal. This system handles payment webhooks, generates secure activation codes, and validates them for company onboarding.

## Database Schema

### 1. activation_codes table
- `id`: Primary key
- `code`: Unique activation code (format: XXXX-XXXX-XXXX-XXXX)
- `company_name`: Name of the company purchasing the subscription
- `plan_type`: Subscription plan (starter/pro/enterprise)
- `email`: Customer email address
- `created_at`: When the code was created
- `expires_at`: Code expiration date
- `used_at`: When the code was used
- `used_by_ip`: IP address that used the code
- `max_uses`: Maximum number of times code can be used
- `current_uses`: Current usage count
- `status`: Code status (active/used/expired/cancelled)
- `payment_reference`: Reference to payment provider transaction
- `payment_amount`: Amount paid
- `payment_currency`: Currency (default: USD)
- `metadata`: Additional JSON metadata

### 2. payment_logs table
- Tracks all incoming payment webhooks
- Stores payment provider details (Stripe, PayPal, etc.)
- Links to activation codes when generated
- Tracks processing status

### 3. activation_code_usage table
- Records each use of an activation code
- Links to company and user who activated
- Tracks IP address and user agent

## API Endpoints

### Public Endpoints (No Auth Required)

1. **POST /api/payment/webhooks/:provider**
   - Receives payment webhooks from providers (Stripe, PayPal)
   - Automatically creates activation codes for successful payments
   - Sends email with activation code to customer

2. **POST /api/payment/activation/validate**
   - Validates an activation code
   - Returns company details if valid
   - Body: `{ "code": "XXXX-XXXX-XXXX-XXXX" }`

3. **GET /api/payment/activation/status/:code**
   - Gets current status of an activation code
   - Returns code details without sensitive payment info

### Protected Endpoints

4. **POST /api/payment/activation/use** (Requires Auth)
   - Marks an activation code as used
   - Links to company and user
   - Body: `{ "code": "...", "company_id": 1, "user_id": 1 }`

### Admin Endpoints

5. **POST /api/payment/admin/activation-codes** (Admin Only)
   - Manually create activation codes
   - Body: `{ "company_name": "...", "plan_type": "...", "email": "..." }`

6. **GET /api/payment/admin/payment-logs** (Admin Only)
   - View payment logs with filtering options
   - Query params: `processed`, `start_date`, `end_date`, `email`

## Features

### Secure Code Generation
- Cryptographically secure 16-character codes
- Format: XXXX-XXXX-XXXX-XXXX (4 groups of 4 hex characters)
- Guaranteed unique codes with retry mechanism

### Automatic Email Notifications
- Sends activation code via email immediately after payment
- Includes subscription details and expiration date
- Professional HTML email template

### Code Validation
- Checks expiration date
- Verifies usage limits
- Tracks IP addresses for security
- Returns appropriate error messages

### Payment Webhook Processing
- Supports Stripe and PayPal webhooks
- Signature verification for security
- Idempotent processing (prevents duplicate codes)
- Automatic status tracking

### Transaction Support
- All database operations use transactions
- Ensures data consistency
- Rollback on errors

## Integration with Onboarding Portal

The onboarding portal should:

1. **Activation Code Entry**
   - Prompt for activation code during registration
   - Call `/api/payment/activation/validate` to verify
   - Display company name and plan details

2. **Code Usage**
   - After successful company creation, call `/api/payment/activation/use`
   - Pass the new company_id and user_id
   - This marks the code as used and prevents reuse

## Testing

A test script is available at `test-payment-integration.js`:
```bash
node test-payment-integration.js
```

## Environment Variables

Add these to your `.env` file:
```
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

## Plan Details

- **Starter**: $299/month, 5 vessels, 50 users
- **Pro**: $599/month, 10 vessels, 100 users  
- **Enterprise**: Custom pricing, unlimited vessels/users

## Security Considerations

1. Webhook signatures are verified (when secrets are configured)
2. Activation codes expire after 30 days by default
3. All usage is tracked with IP addresses
4. Codes are single-use by default
5. Database transactions ensure consistency

## Next Steps

1. Configure payment provider webhook endpoints:
   - Stripe: `https://your-domain.com/api/payment/webhooks/stripe`
   - PayPal: `https://your-domain.com/api/payment/webhooks/paypal`

2. Add webhook secrets to environment variables

3. Integrate activation code validation into onboarding portal

4. Set up monitoring for payment logs

5. Configure email service for production (currently using Ethereal for testing)