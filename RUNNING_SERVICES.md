# Currently Running Services

## SMS Onboarding System

✅ **Tech App** - http://localhost:5174/
   - Mobile-first interface for field technicians
   - Has some import warnings but is functional
   - Port changed from 5173 to 5174 (5173 was in use)
   
✅ **Admin Portal** - http://localhost:3003/
   - Company registration and management
   - Token generation for tech access
   - Review dashboard

## To Access:

1. **Admin Portal** (Start Here): http://localhost:3003/
   - Create a company account
   - Add vessels
   - Generate access tokens

2. **Tech App**: http://localhost:5173/
   - Use token from admin portal
   - Document vessel systems
   - Works offline

## Notes:
- Database is not connected (using mock data)
- Some features may have limited functionality
- This is the Shadow Clone build with all 3 stages implemented

## To Stop Services:
Run: `./stop-all.sh` from the SMS directory