import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes (we'll create these next)
import authRoutes from './routes/auth.routes';
import authBridgeRoutes from './routes/auth-bridge.routes';
import companyRoutes from './routes/company.routes';
import equipmentRoutes from './routes/equipment.routes';
import faultRoutes from './routes/fault.routes';
import integrationRoutes from './routes/integration.routes';
import equipmentTransferRoutes from './routes/equipment-transfer.routes';
import feedbackRoutes from './routes/feedback.routes';
import vesselsRoutes from './routes/vessels.routes';
import fileRoutes from './routes/file.routes';
import syncRoutes from './routes/sync.routes';
import channelsRoutes from './routes/channels.routes';
import messagesRoutes from './routes/messages.routes';
import hseRoutes from './routes/hse.routes';
import teamRoutes from './routes/team.routes';
import paymentRoutes from './routes/payment.routes';
import emailRoutes from './routes/email.routes';
import activationHelpRoutes from './routes/activation-help.routes';
import adminActivationRoutes from './routes/admin-activation.routes';
import maintenanceStatusRoutes from './routes/maintenance-status.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import inventory and invoice routes (JavaScript modules)
const inventoryRoutes = require('./routes/inventory');
const invoiceRoutes = require('./routes/invoices');

// Import database initialization
import { initializeDatabase } from './config/database.abstraction';
import { initializeFeedbackTable } from './controllers/feedback.controller';
import { maintenanceReminderService } from './services/maintenance-reminder.service';
import { addRefreshTokensTable } from './migrations/add-refresh-tokens';
import syncService from './services/sync.service';
import WebSocketService from './services/websocket.service';
import { scheduledJobsService } from './services/scheduled-jobs.service';
import { securityMonitoring } from './services/security-monitoring.service';

// Import inventory jobs
const inventoryJobs = require('./jobs/inventoryJobs');

// Import analytics jobs
import { analyticsJobs } from './jobs/analyticsJobs';

const app = express();
const PORT = process.env.PORT || 3005;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
let webSocketService: WebSocketService;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/bridge', authBridgeRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/transfers', equipmentTransferRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/vessels', vesselsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/hse', hseRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/activation', activationHelpRoutes);
app.use('/api/admin/activation', adminActivationRoutes);
app.use('/api', maintenanceStatusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', invoiceRoutes);

// Import health check
import { checkDatabaseHealth } from './utils/db-health-check';

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  res.json({ 
    status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded', 
    timestamp: new Date().toISOString(),
    service: 'SMS Backend API',
    database: dbHealth
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    await initializeFeedbackTable();
    await addRefreshTokensTable();
    
    // Run sync logs migration
    const { up: addSyncLogs } = await import('./migrations/add-sync-logs');
    await addSyncLogs();
    
    // Run last seen migration
    const { up: addLastSeen } = await import('./migrations/add-last-seen');
    await addLastSeen();
    
    // Run communication tables migration
    const { up: addCommunicationTables } = await import('./migrations/add-communication-tables');
    await addCommunicationTables();
    
    // Run payment integration migration
    const { up: addPaymentIntegration } = await import('./migrations/add-payment-integration');
    await addPaymentIntegration();
    
    // Run security tables migration
    const { up: addSecurityTables } = await import('./migrations/add-security-tables');
    await addSecurityTables();
    
    // Run maintenance status flag migration
    const { up: addMaintenanceStatusFlag } = await import('./migrations/add-maintenance-status-flag');
    await addMaintenanceStatusFlag();
    
    console.log('✅ Database initialized');
    
    // Initialize WebSocket service
    webSocketService = new WebSocketService(server);
    console.log('✅ WebSocket service initialized');
    
    // Start scheduled jobs
    scheduledJobsService.start();
    console.log('✅ Scheduled jobs started');
    
    // Start inventory jobs
    inventoryJobs.start();
    console.log('✅ Inventory monitoring jobs started');
    
    // Start analytics jobs
    analyticsJobs.start();
    console.log('✅ Analytics jobs started');
    
    // Start security monitoring
    if (process.env.ENABLE_SECURITY_MONITORING !== 'false') {
      securityMonitoring.startMonitoring();
      console.log('✅ Security monitoring started');
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 SMS Backend API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server listening on port ${PORT}`);
      console.log(`📧 Email automation service running`);
      console.log(`🔒 Security monitoring: ${process.env.ENABLE_SECURITY_MONITORING !== 'false' ? 'Active' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export WebSocket service for use in other modules
export { webSocketService };