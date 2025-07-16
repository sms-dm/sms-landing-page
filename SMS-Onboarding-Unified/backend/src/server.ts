// SMS Onboarding Portal Backend Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { config } from '../config';
import { sessionService } from '../services/session.service';
import { logger, requestLogger } from '../services/logger.service';
import { websocketService } from '../services/websocket.service';
import { scheduledTasksService } from '../services/scheduled-tasks.service';
import { prisma, checkDatabaseConnection } from '../services/prisma';
import { performDatabaseHealthCheck } from '../utils/db-health';
import apiRoutes from '../api/routes';
import { apiRateLimiter } from '../api/middleware/rateLimit.middleware';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
}));

// CORS configuration
app.use(cors(config.cors));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => requestLogger.info(message.trim()),
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for local uploads
if (config.env === 'development' || !config.aws.accessKeyId) {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

// Global rate limiting
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Perform comprehensive database health check
    const dbHealth = await performDatabaseHealthCheck();
    
    if (!dbHealth.connected) {
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: config.env,
        error: 'Database connection failed',
        database: {
          connected: false,
          error: dbHealth.error,
          latency: dbHealth.latency
        }
      });
    }
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
      demoMode: config.demo.enabled,
      services: {
        database: 'connected',
        websocket: 'active',
        storage: config.aws.accessKeyId ? 's3' : 'local',
      },
      database: {
        connected: true,
        latency: dbHealth.latency,
        ...dbHealth.details
      }
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: config.env,
      error: 'Health check failed',
    });
  }
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Resource not found',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  const status = err.status || 500;
  const message = config.env === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';
  
  res.status(status).json({
    code: err.code || 'ERROR',
    message,
    ...(config.env === 'development' && { 
      stack: err.stack,
      details: err.details,
    }),
  });
});

// Start server
const PORT = config.port;

// Initialize database connection before starting server
async function startServer() {
  try {
    // Check database connection
    logger.info('Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      logger.warn('Database connection failed. Running in mock mode.');
      // Don't exit - allow mock mode
    }
    
    // Perform initial health check
    const dbHealth = await performDatabaseHealthCheck();
    logger.info('Database connection established', dbHealth.details);
    
    // Start scheduled tasks
    scheduledTasksService.start();
    logger.info('Scheduled tasks service started');
    
    httpServer.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        environment: config.env,
        demoMode: config.demo.enabled,
        database: dbHealth.details
      });
      
      console.log(`
🚀 SMS Onboarding Portal Backend
📍 Environment: ${config.env}
🌐 Server running on port ${PORT}
🔐 Demo mode: ${config.demo.enabled ? 'ENABLED' : 'DISABLED'}
📊 API Base URL: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
💾 Storage: ${config.aws.accessKeyId ? 'AWS S3' : 'Local filesystem'}
🗄️  Database: ${dbHealth.details?.databaseType} (${dbHealth.connected ? 'Connected' : 'Disconnected'})
⏱️  DB Latency: ${dbHealth.latency}ms
⏰ Scheduled Tasks: Active
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Stop session cleanup
      sessionService.stopCleanup();
      
      // Stop scheduled tasks
      scheduledTasksService.stop();
      logger.info('Scheduled tasks stopped');
      
      // Close database connection
      await prisma.$disconnect();
      logger.info('Database connection closed');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;