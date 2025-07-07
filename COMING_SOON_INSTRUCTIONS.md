# Coming Soon Page Instructions

## Overview
The SMS landing page now shows a "Coming Soon" page by default to keep the project under wraps until launch.

## Features
- **Glitchy intro effect** (2 seconds)
- **Animated logo and text** fade-in
- **Futuristic design** with neon blues
- **Hidden login** functionality

## How to Access the Full Site

### Secret Login Process:
1. Go to your domain (shows Coming Soon page)
2. **Click the SMS logo 5 times** within 2 seconds
3. A login modal will appear
4. Enter credentials:
   - Email: `info@smartmarine.uk`
   - Password: `SmartMarine25!`
5. You'll be redirected to `/preview` with the full landing page

### Direct Access:
- Once logged in, you can bookmark `/preview`
- Authentication is saved in browser (localStorage)
- To logout: Clear browser data or use DevTools to remove `sms-preview-auth` from localStorage

### Portal Access:
- Direct login still works: `/login`
- This bypasses the coming soon page
- Useful for clients who know the URL

## Technical Details
- Authentication stored in `localStorage` as `sms-preview-auth`
- Preview route protected with React Router
- Logo click counter resets after 2 seconds
- Glitch effect uses CSS animations

## To Disable Coming Soon:
When ready to go live, simply edit `App.tsx`:
- Change Route path="/" to show `<HomePage />` instead of `<ComingSoonPage />`
- Remove the preview route protection

## Security Note
This is basic protection for pre-launch. For production:
- Consider server-side authentication
- Use environment variables for credentials
- Implement proper session management