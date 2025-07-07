# SMS Onboarding Portal

Production-ready vessel onboarding system with offline-first capabilities.

## Architecture Overview

This is a monorepo-friendly React application built with:
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Redux Toolkit** for state management
- **React Query** for server state
- **React Router v6** for navigation
- **Tailwind CSS** with Shadcn/ui components
- **PWA** support for offline functionality

## Project Structure

```
sms-app/
├── src/
│   ├── app/              # Application core (layouts, router)
│   ├── features/         # Feature modules (admin, tech, manager, auth, common)
│   ├── components/       # Shared components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services and external integrations
│   ├── store/           # Redux store and slices
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── styles/          # Global styles
├── public/              # Static assets
└── tests/              # Test files
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Role-Based Access

The application supports three main user roles:
- **Admin**: Company and vessel management, token generation
- **Technician**: Equipment documentation and offline data collection
- **Manager**: Quality review and approval workflows

### Key Features

- **Offline-First**: Full functionality without internet connection
- **PWA Support**: Installable as a native app
- **Role-Based Routing**: Automatic route protection based on user roles
- **Type Safety**: Complete TypeScript coverage
- **Code Splitting**: Lazy loading for optimal performance
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Works on all device sizes

## Environment Configuration

See `.env.example` for all available configuration options. Key settings include:
- Supabase credentials
- AWS S3/CloudFront configuration
- API endpoints
- Feature flags
- Security settings

## Production Deployment

The build output in `dist/` is optimized for production with:
- Code splitting and lazy loading
- Asset optimization
- PWA manifest and service worker
- Source maps for debugging
- Vendor chunk splitting

Deploy the `dist/` folder to any static hosting service (AWS S3, Netlify, Vercel, etc.).