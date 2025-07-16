# Wave Development Constitution

## Core Principles
1. **Master Craftsman Standard**: Every line of code reflects excellence
2. **No Weak Links**: System integrity is paramount
3. **Quality Over Speed**: Well-reasoned decisions only
4. **Collaborative Excellence**: Masters working as equals
5. **Clear Ownership**: Defined boundaries and responsibilities

## Communication Protocols
1. **File Reservations**: Check and update `/home/sms/repos/SMS/.waves/file_reservations.md` before modifying shared files
2. **Wave Coordination**: Each wave builds upon the previous
3. **Interface Contracts**: Define clear APIs between components
4. **Documentation First**: Document decisions and patterns

## Technical Standards
1. **TypeScript**: Strict mode, no `any` types
2. **Testing**: Minimum 80% coverage
3. **Code Review**: All code peer-reviewed
4. **Performance**: Server-side rendering by default
5. **Security**: Authentication on all admin routes

## Wave Execution
- **Wave 1**: Foundation (Authentication, Admin Portal Base, API Structure)
- **Wave 2**: UI/UX (Dashboard Components, User Experience)
- **Wave 3**: Core Features (Onboarding Wizards, Data Management)
- **Wave 4**: Integration (Testing, Deployment, Monitoring)

## File Organization
```
.waves/
├── constitution.md (this file)
├── file_reservations.md
├── wave-1/
│   ├── admin-foundation/
│   ├── auth-system/
│   └── api-foundation/
├── wave-2/
│   ├── dashboard-ui/
│   └── mobile-experience/
├── wave-3/
│   ├── onboarding-wizards/
│   └── data-management/
└── wave-4/
    ├── testing-suite/
    └── deployment/
```

## Coordination Points
1. **Daily Sync**: Check file reservations
2. **API Contracts**: Document in shared types
3. **Component Interfaces**: Define props clearly
4. **Database Schema**: Coordinate changes
5. **Authentication Flow**: Central auth service