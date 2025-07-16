# SMS Onboarding Portal - Demo Guide

Welcome to the SMS Onboarding Portal demo! This guide will walk you through the key features and workflows.

## Quick Start

1. **Start the application:**
   ```bash
   ./start-all.sh
   ```

2. **Access the portal:**
   - Open your browser to: http://localhost:5173

3. **Login with demo credentials:**

   | Role | Email | Password |
   |------|-------|----------|
   | Admin | admin@demo.com | Demo123! |
   | Manager | manager@demo.com | Demo123! |
   | Technician | tech@demo.com | Demo123! |
   | HSE Officer | hse@demo.com | Demo123! |

## Demo Scenarios

### 1. Admin Workflow

**Login as Admin (admin@demo.com)**

1. **Company Setup:**
   - Navigate to Admin Dashboard
   - Set up company information
   - Configure departments

2. **User Management:**
   - Create new users
   - Assign roles
   - View user activity

3. **Vessel Setup:**
   - Add a new vessel
   - Configure vessel details
   - Assign to departments

### 2. Manager Workflow

**Login as Manager (manager@demo.com)**

1. **Team Management:**
   - View assigned technicians
   - Assign vessels to technicians
   - Monitor team progress

2. **Review Process:**
   - Review equipment submissions
   - Approve/reject onboarding data
   - Export reports

3. **Quality Monitoring:**
   - Check quality scores
   - View completion rates
   - Track performance metrics

### 3. Technician Workflow

**Login as Technician (tech@demo.com)**

1. **Vessel Assignment:**
   - View assigned vessels
   - Start onboarding process

2. **Equipment Onboarding:**
   - Add new equipment
   - Upload photos
   - Fill equipment details
   - Add parts information

3. **Offline Mode:**
   - Toggle offline mode (airplane icon)
   - Continue working offline
   - Data syncs automatically when online

4. **Photo Capture:**
   - Take equipment photos
   - Add multiple angles
   - Annotate if needed

### 4. HSE Officer Workflow

**Login as HSE Officer (hse@demo.com)**

1. **Safety Compliance:**
   - Review safety equipment
   - Update certificates
   - Manage emergency contacts

2. **HSE Dashboard:**
   - Monitor compliance status
   - Track safety metrics
   - Generate HSE reports

## Key Features to Demo

### 1. Offline Capability
- Disconnect internet
- Continue using the app
- See sync status indicator
- Reconnect to auto-sync

### 2. Multi-Platform Support
- Resize browser to mobile view
- Test touch interactions
- Check responsive design

### 3. Real-time Updates
- Open two browser tabs
- Login as different users
- See real-time notifications

### 4. Search and Filter
- Use global search
- Filter by vessel
- Filter by status
- Sort results

### 5. Data Export
- Export equipment lists
- Download reports
- Generate summaries

## Demo Data

The system comes pre-loaded with:
- 4 demo users (different roles)
- Sample vessels
- Example equipment types
- Demo parts catalog

## Testing Scenarios

### Scenario 1: Complete Onboarding
1. Admin creates vessel
2. Manager assigns to technician
3. Technician onboards equipment
4. Manager reviews and approves
5. View completed vessel

### Scenario 2: Offline Onboarding
1. Technician goes offline
2. Adds equipment offline
3. Takes photos offline
4. Goes online to sync

### Scenario 3: Team Collaboration
1. Multiple technicians work on same vessel
2. Manager monitors progress
3. HSE officer updates safety info
4. Admin views reports

## Tips for Demo

1. **Show Mobile Experience:**
   - Use browser dev tools
   - Toggle device mode
   - Show touch interactions

2. **Highlight Performance:**
   - Fast page loads
   - Smooth transitions
   - Instant search

3. **Demonstrate Security:**
   - Role-based access
   - Secure authentication
   - Session management

4. **Emphasize Ease of Use:**
   - Intuitive navigation
   - Clear workflows
   - Helpful tooltips

## Common Questions

**Q: How long does data stay offline?**
A: Indefinitely. Data persists even after browser restart.

**Q: What happens if two users edit the same data?**
A: Last write wins, with conflict detection for critical data.

**Q: Can I customize the workflow?**
A: Yes, workflows can be customized per company needs.

**Q: Is there a limit to offline storage?**
A: Depends on device, typically 50-100MB available.

## Troubleshooting Demo

### Issue: Can't login
- Check services are running: `./start-all.sh`
- Verify demo mode is enabled in .env

### Issue: No offline capability
- Check browser supports Service Workers
- Ensure HTTPS or localhost
- Clear browser cache

### Issue: Photos not working
- Allow camera permissions
- Check browser compatibility
- Use HTTPS for camera access

## Reset Demo Data

To reset to fresh demo data:
```bash
cd backend
npm run db:reset
npm run db:seed
```

## Next Steps

After the demo:
1. Discuss customization needs
2. Plan deployment strategy
3. Schedule training sessions
4. Set up production environment

## Contact

For demo support or questions:
- Check application logs
- Review error messages
- Consult documentation

Happy demoing!