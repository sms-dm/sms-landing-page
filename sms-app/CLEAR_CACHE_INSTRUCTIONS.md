# Clear Browser Cache Instructions

The authentication issue occurs because your browser has old login data from the previous Geoquip session. Please follow these steps:

## Quick Fix:

1. **Open browser developer tools** (F12 or right-click → Inspect)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** in the left sidebar
4. Click on `http://localhost:3000`
5. Delete the `sms_token` entry (or clear all)
6. Refresh the page

## Alternative: Use Incognito/Private Mode

Open the app in an incognito/private browser window:
- Chrome: Ctrl+Shift+N (Windows/Linux) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)

## Then Login with Oceanic Demo Credentials:

- **Technician**: demo.tech@oceanic.com / demo123
- **Manager**: demo.manager@oceanic.com / demo123
- **Admin**: demo.admin@oceanic.com / demo123

The app should now show:
1. Oceanic Marine Services branding
2. Three ocean-themed vessels to select from
3. Proper company data throughout the system