# Smart Maintenance System (SMS) - Local Demo

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend will start on http://localhost:3001

### Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm start
```
The frontend will start on http://localhost:3000

## 🔐 Demo Login Credentials

### Company URL: http://localhost:3000/geoquip

- **Technician**: john.smith@geoquip.com / demo123
- **Manager**: sarah.jones@geoquip.com / demo123  
- **Admin**: admin@geoquip.com / demo123

## 📁 Project Structure

```
sms-app/
├── backend/
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── index.ts     # Server entry point
│   └── data/           # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.tsx      # Main app component
│   └── public/         # Static assets
```

## 🌟 Key Features

1. **Company Branded Login** - Each company gets custom branding
2. **Role-Based Dashboards** - Different views for Technician/Manager/Admin
3. **QR Code Equipment Tracking** - Scan to access equipment info
4. **Intelligent Drawing Search** - Search schematics by function
5. **Fault Management** - Report and track equipment faults
6. **Hidden Revenue Tracking** - 20% markup on parts (internal only)

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (PostgreSQL ready)
- **Authentication**: JWT tokens
- **State Management**: React Context + React Query

## 📊 Database Schema

The system uses a multi-tenant architecture with:
- Companies
- Vessels  
- Users (with roles)
- Equipment (with QR codes)
- Documents
- Faults
- Parts tracking
- Maintenance logs

## 🎯 Next Steps

1. **Test Core Features**
   - Login with different roles
   - Browse equipment
   - Create fault reports
   - View dashboards

2. **Add Missing Features**
   - Intelligent drawing search
   - AI assistant
   - Real-time notifications
   - Community features

3. **Production Readiness**
   - Switch to PostgreSQL
   - Add file upload to cloud storage
   - Implement Elasticsearch
   - Deploy to cloud

## 🐛 Troubleshooting

- **Port already in use**: Kill processes on ports 3000/3001
- **Database errors**: Delete `backend/data/sms.db` and restart
- **Module not found**: Run `npm install` in the affected directory

## 📝 Environment Variables

Create `.env` files:

**backend/.env**
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:3001/api
```