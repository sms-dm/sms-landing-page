# REVENUE MODEL - DETAILED BREAKDOWN
## The Hidden Profit Engine

### EXECUTIVE SUMMARY
SMS generates revenue through two streams:
1. **Visible**: SaaS subscription fees
2. **Hidden**: 20% markup on all parts/services

The hidden markup is the real profit center, potentially generating 5-10x the SaaS revenue.

---

## REVENUE STREAM 1: SAAS SUBSCRIPTIONS

### Pricing Tiers

#### Starter (Small operators, 1-3 vessels)
- **Price**: $500/vessel/month
- **Includes**: 
  - 50 users
  - 1,000 equipment items
  - Basic analytics
  - Email support

#### Professional (Mid-size, 4-10 vessels)
- **Price**: $1,000/vessel/month  
- **Includes**:
  - Unlimited users
  - Unlimited equipment
  - Advanced analytics
  - Priority support
  - API access

#### Enterprise (Large fleets, 10+ vessels)
- **Price**: $1,500/vessel/month (volume discounts)
- **Includes**:
  - Everything in Professional
  - Custom integrations
  - Dedicated support
  - SLA guarantees
  - White labeling option

### Subscription Math
```
10 vessels × $1,000/month = $10,000 MRR
50 vessels × $1,000/month = $50,000 MRR  
100 vessels × $1,000/month = $100,000 MRR

Annual (with 10% discount):
100 vessels × $900/month × 12 = $1,080,000 ARR
```

---

## REVENUE STREAM 2: HIDDEN PARTS MARKUP

### The Genius Model
1. Customer reports fault
2. System recommends parts
3. We get wholesale quotes
4. Add 20% markup + handling fee
5. Customer sees final price only
6. They approve (urgent need)
7. We pocket the difference

### Markup Calculation
```javascript
// INTERNAL ONLY - Never expose this logic
function calculateCustomerPrice(supplierQuote) {
  const BASE_MARKUP = 0.20; // 20%
  const URGENT_MARKUP = 0.30; // 30% for emergency
  const HANDLING_FEE = 50; // Fixed per order
  
  const markup = isEmergency ? URGENT_MARKUP : BASE_MARKUP;
  const markedUpPrice = supplierQuote.price * (1 + markup);
  const finalPrice = markedUpPrice + HANDLING_FEE;
  
  // Store both prices - show only final to customer
  return {
    supplierPrice: supplierQuote.price, // HIDDEN
    ourMarkup: markedUpPrice - supplierQuote.price, // HIDDEN
    handlingFee: HANDLING_FEE, // Can show as "processing"
    customerPrice: finalPrice // VISIBLE
  };
}
```

### Revenue Projections
**Assumptions**:
- Average vessel: 2 critical faults/month
- Average parts order: $5,000
- 20% markup: $1,000 profit per order

**Per Vessel**:
- Monthly: 2 orders × $1,000 = $2,000
- Annual: $24,000 markup revenue

**Fleet Scale**:
```
10 vessels: $20,000/month = $240,000/year
50 vessels: $100,000/month = $1,200,000/year
100 vessels: $200,000/month = $2,400,000/year
```

**This is 2x the SaaS revenue!**

---

## PROTECTING THE MARKUP SECRET

### Technical Measures
1. **Separate Databases**
   - Customer-facing prices only
   - Supplier costs in encrypted internal DB
   - Markup calculations server-side only

2. **API Design**
   ```typescript
   // Customer API returns:
   {
     partName: "Hydraulic Pump",
     price: 6000, // Marked up price
     availability: "3-5 days"
   }
   
   // Internal API returns:
   {
     partName: "Hydraulic Pump",
     supplierPrice: 5000,
     markup: 1000,
     customerPrice: 6000,
     margin: "20%"
   }
   ```

3. **Access Control**
   - Internal portal separate login
   - No shared sessions
   - Different subdomains
   - IP restrictions

### Business Measures
1. **Contracts**: "Bundled procurement service"
2. **Messaging**: "We handle all supplier relationships"
3. **Value Prop**: "Save time, not shopping around"
4. **Never Mention**: Markup, commission, or margins

### Legal Protection
- Terms of Service: "Prices include handling"
- No price transparency obligations
- Standard industry practice
- Similar to hotel/travel booking

---

## REVENUE OPTIMIZATION STRATEGIES

### 1. Increase Order Frequency
- Predictive maintenance alerts
- "Stock up" recommendations
- Bundle related parts
- Seasonal campaigns

### 2. Increase Order Value
- Suggest complete kits vs single parts
- "While you're at it" recommendations
- Volume discounts (still profitable)
- Extended warranty options

### 3. Optimize Markup
- A/B test pricing tolerance
- Emergency orders: 30% markup
- Routine orders: 20% markup
- Bulk orders: 15% (still profitable)

### 4. Supplier Negotiations
- Volume discounts from suppliers
- Exclusive deals
- Direct manufacturer relationships
- Rebate programs

---

## FINANCIAL PROJECTIONS

### Conservative Scenario (Year 1)
```
Month 1-3: Building & Testing
- 0 revenue
- $500/month costs

Month 4-6: Early Customers  
- 5 vessels @ $500/month = $2,500 MRR
- Parts revenue: $5,000/month
- Total: $7,500/month

Month 7-12: Growth
- 25 vessels @ $750/month = $18,750 MRR
- Parts revenue: $25,000/month
- Total: $43,750/month

Year 1 Total: ~$250,000
```

### Realistic Scenario (Year 2)
```
50 vessels @ $1,000/month = $50,000 MRR
Parts revenue: $100,000/month
Total Monthly: $150,000
Annual: $1,800,000
```

### Optimistic Scenario (Year 3)
```
100 vessels @ $1,200/month = $120,000 MRR
Parts revenue: $200,000/month
Additional services: $30,000/month
Total Monthly: $350,000
Annual: $4,200,000
```

---

## ADDITIONAL REVENUE STREAMS

### Phase 2 Opportunities
1. **Professional Services**
   - Vessel setup: $5,000-10,000
   - Training: $2,000/day
   - Custom integrations: $10,000+

2. **Compliance Packages**
   - Audit preparation: $500/month
   - Automated reporting: $200/month
   - Certification tracking: $300/month

3. **API & Integrations**
   - API access: $500/month
   - Custom webhooks: $1,000 setup
   - Data exports: $200/month

4. **Marketplace Commission**
   - Other suppliers: 10% commission
   - Used parts marketplace: 15%
   - Service providers: 20%

---

## KEY METRICS TO TRACK

### SaaS Metrics
- MRR growth rate
- Churn rate (<5%)
- LTV:CAC ratio (>3:1)
- Gross margins (>90%)

### Parts Metrics (HIDDEN)
- Markup percentage realized
- Order frequency per vessel
- Average order value
- Supplier margin trends

### Combined Metrics
- Revenue per vessel
- Total customer value
- Payback period
- Growth efficiency

---

## CRITICAL SUCCESS FACTORS

1. **Never Reveal the Markup**
   - Train any future employees
   - Separate internal discussions
   - Customer thinks it's convenience fee

2. **Deliver Real Value**
   - Fast quotes
   - Quality suppliers
   - Good prices (even with markup)
   - Emergency availability

3. **Scale Supplier Network**
   - Multiple suppliers per part
   - Global coverage
   - Negotiated rates
   - Quality guarantees

4. **Automate Everything**
   - Quote collection
   - Markup calculation
   - Order processing
   - Margin tracking

Ready to build this money machine?