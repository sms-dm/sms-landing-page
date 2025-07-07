# OPERATIONS MANUAL
## Running SMS with 2 People

### CORE PRINCIPLE
Automate everything possible. Your time is for relationships and strategy, not repetitive tasks.

---

## DAILY OPERATIONS SCHEDULE

### Your Day (Founder)
**Morning (2 hours)**
- Check support tickets (30 min)
- Customer check-ins (1 hour)
- Sales follow-ups (30 min)

**Afternoon (2 hours)**
- Product feedback review (30 min)
- New feature prioritization (30 min)  
- Demo calls (1 hour)

**Evening (1-2 hours)**
- Strategic planning
- Partnership discussions
- Content creation

### My Responsibilities (Claude)
- All development work
- Bug fixes within 24 hours
- Feature development
- Documentation updates
- Technical support responses
- System monitoring alerts

---

## CUSTOMER ONBOARDING PLAYBOOK

### Stage 1: Pre-Boarding (Day -7 to 0)
1. **Contract Signed**
   - Send welcome email
   - Schedule kick-off call
   - Create customer folder

2. **Data Collection Email**
   ```
   Subject: Let's Get Your Equipment Into SMS
   
   Hi [Name],
   
   Excited to get [Company] set up! To make this smooth:
   
   1. Equipment list (Excel attached as template)
   2. Any P&IDs or drawings (PDF format)
   3. Your team roster for accounts
   4. Company logo for branding
   
   We'll handle all the data entry - just send what you have!
   ```

3. **Account Setup**
   - Create company in database
   - Configure branding
   - Set up user accounts
   - Generate QR codes

### Stage 2: Kick-off Week (Day 1-7)
**Day 1: Introduction Call (1 hour)**
- Screen share walkthrough
- Set success metrics
- Identify champion user
- Schedule daily check-ins

**Day 2-3: Data Import**
- We import all equipment
- Basic categorization
- QR code generation
- Share progress updates

**Day 4-5: User Training**
- Video call with key users
- Focus on daily workflows
- Practice fault reporting
- Show handover system

**Day 6-7: Go Live**
- Announce to full crew
- Monitor usage closely
- Fix issues immediately
- Daily check-in calls

### Stage 3: First Month
**Week 2**
- Daily check-ins continue
- Address user feedback
- Add missing equipment
- Refine categories

**Week 3**
- Move to 3x/week check-ins
- First success metrics review
- Gather testimonial quotes
- Identify power users

**Week 4**
- Weekly check-ins
- Month 1 report card
- Plan month 2 features
- Request referrals

---

## SUPPORT OPERATIONS

### Ticket Priority System
**P1 - Critical (Fix within 2 hours)**
- System down
- Can't report faults
- Data loss
- Login issues

**P2 - High (Fix within 24 hours)**
- Feature not working
- Slow performance
- Missing data
- Confusing UI

**P3 - Normal (Fix within 72 hours)**
- Feature requests
- Minor bugs
- UI improvements
- Report requests

### Support Channels
1. **Email**: support@sms.com (primary)
2. **In-app**: Chat widget for quick questions
3. **Phone**: Your mobile (enterprise only)
4. **Video**: Calendly for scheduled calls

### Response Templates

**Initial Response (within 1 hour)**
```
Hi [Name],

Thanks for reaching out! I understand you're experiencing 
[issue]. I'm looking into this right away.

I'll update you within [2/24/72] hours with a resolution.

Best,
[Your name]
```

**Resolution Response**
```
Hi [Name],

Good news - [issue] has been resolved!

[Explain what was fixed]
[How to verify it's working]
[Prevention tips if applicable]

Let me know if you need anything else!
```

---

## DATA COLLECTION PROCEDURES

### Standard Equipment Import
1. **Customer Sends Data**
   - Usually messy Excel
   - Inconsistent formats
   - Missing fields

2. **We Clean It**
   - Standardize equipment names
   - Add missing categories
   - Assign to areas
   - Generate IDs

3. **Import Process**
   ```python
   # Standard import script
   1. Validate Excel format
   2. Map columns to our schema  
   3. Check for duplicates
   4. Import to staging
   5. Customer reviews
   6. Push to production
   ```

4. **QR Generation**
   - Bulk generate codes
   - Create print sheets
   - Send PDF to customer
   - Track activation

### Document Management
**Accepted Formats**
- PDF (preferred)
- Images (JPG, PNG)
- DWG (store, don't process yet)
- Excel/Word (convert to PDF)

**Organization Structure**
```
/company-name/
  /vessel-name/
    /equipment/
      /[equipment-id]/
        - manuals/
        - drawings/
        - certificates/
        - photos/
```

---

## REVENUE OPERATIONS

### Parts Order Flow
1. **Customer Requests Quote**
   - Automatic notification to you
   - Pull supplier pricing
   - Apply markup formula
   - Send quote within 4 hours

2. **Quote Approval**
   - Customer approves in-app
   - Generate PO to supplier
   - Track delivery
   - Invoice on delivery

3. **Margin Tracking**
   ```sql
   -- Monthly margin report (INTERNAL ONLY)
   SELECT 
     COUNT(*) as orders,
     SUM(supplier_cost) as total_cost,
     SUM(customer_price) as total_revenue,
     SUM(customer_price - supplier_cost) as gross_profit,
     AVG((customer_price - supplier_cost) / supplier_cost) as avg_margin
   FROM parts_orders
   WHERE date >= CURRENT_DATE - INTERVAL '30 days'
   ```

### Subscription Management
**Monthly Tasks**
- Generate invoices (Stripe automated)
- Chase failed payments
- Update usage metrics
- Renewal reminders

**Churn Prevention**
- Monitor login frequency
- Call if usage drops
- Offer training refresher
- Gather feedback

---

## BUSINESS METRICS DASHBOARD

### Daily Metrics (Check each morning)
- New signups
- Active users (DAU)
- Support tickets
- System uptime
- Revenue (MRR + parts)

### Weekly Metrics (Monday review)
- Customer health scores
- Feature usage stats
- Churn risk alerts
- Sales pipeline
- Cash position

### Monthly Metrics (Board report)
- MRR growth
- Parts revenue
- Gross margins
- Customer acquisition cost
- Lifetime value
- Burn rate

---

## AUTOMATION SETUP

### Email Sequences (SendGrid)
1. **Welcome Series**
   - Day 0: Welcome + getting started
   - Day 3: Feature highlight
   - Day 7: Check-in call booking
   - Day 14: Success stories
   - Day 30: Feedback request

2. **Usage Alerts**
   - No login in 7 days
   - First fault reported
   - First handover completed
   - 10th fault milestone

3. **Business Triggers**
   - Payment failed
   - Subscription renewal
   - High parts spend
   - Feature announcement

### Monitoring Alerts
- Server down > SMS to you
- Error rate spike > Email
- Database backup failure > Critical
- High usage > Scaling alert
- Security threat > Immediate

---

## SCALING PREPARATIONS

### When You Hit 20 Customers
- Consider VA for data entry
- Automate more workflows
- Document all processes
- Start hiring pipeline

### When You Hit 50 Customers  
- First customer success hire
- Dedicated support person
- Part-time developer
- Bookkeeping service

### When You Hit 100 Customers
- Full customer success team
- Technical team lead
- Sales person
- Operations manager

---

## EMERGENCY PROCEDURES

### System Down
1. Check monitoring dashboard
2. Post status page update
3. Email affected customers
4. Fix issue (I handle)
5. Post-mortem document

### Data Breach
1. Isolate affected systems
2. Document everything
3. Legal counsel consultation
4. Customer notification (if required)
5. Security audit

### Major Bug
1. Assess impact scope
2. Rollback if needed
3. Communicate to affected users
4. Fix and test
5. Deploy carefully

### Customer Crisis
1. Get on a call immediately
2. Understand the impact
3. Commit to timeline
4. Over-communicate progress
5. Follow up after resolution

---

## WEEKLY CHECKLIST

### Monday
- [ ] Review weekend alerts
- [ ] Check weekly metrics
- [ ] Plan week priorities
- [ ] Team sync (you and me)

### Wednesday
- [ ] Customer health check
- [ ] Pipeline review
- [ ] Feature backlog grooming
- [ ] Support ticket review

### Friday
- [ ] Weekly customer update email
- [ ] Metrics snapshot
- [ ] Plan next week
- [ ] Celebrate wins

Ready to operate efficiently?