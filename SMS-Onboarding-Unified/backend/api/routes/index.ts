// Main router aggregator for all API routes
import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import vesselRoutes from './vessel.routes';
import equipmentRoutes from './equipment.routes';
import partRoutes from './part.routes';
import fileRoutes from './file.routes';
import tokenRoutes from './token.routes';
import integrationRoutes from './integration.routes';
import syncRoutes from './sync.routes';
import analyticsRoutes from './analytics.routes';
import batchRoutes from './batch.routes';
import webhookRoutes from './webhook.routes';
import hseRoutes from './hse.routes';
import technicianRoutes from './technician.routes';
import managerEquipmentRoutes from './manager-equipment.routes';
import verificationRoutes from './verification.routes';
import managerRoutes from './manager.routes';

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Mount all route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/companies`, companyRoutes);
router.use(`${API_VERSION}/vessels`, vesselRoutes);
router.use(`${API_VERSION}/equipment`, equipmentRoutes);
router.use(`${API_VERSION}/parts`, partRoutes);
router.use(`${API_VERSION}/files`, fileRoutes);
router.use(`${API_VERSION}/tokens`, tokenRoutes);
router.use(`${API_VERSION}/integration`, integrationRoutes);
router.use(`${API_VERSION}/sync`, syncRoutes);
router.use(`${API_VERSION}/analytics`, analyticsRoutes);
router.use(`${API_VERSION}/batch`, batchRoutes);
router.use(`${API_VERSION}/webhooks`, webhookRoutes);
router.use(`${API_VERSION}/hse`, hseRoutes);
router.use(`${API_VERSION}/technician`, technicianRoutes);
router.use(`${API_VERSION}/manager/equipment`, managerEquipmentRoutes);
router.use(`${API_VERSION}/manager`, managerRoutes);
router.use(`${API_VERSION}/verification`, verificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    message: 'API documentation',
    swaggerUrl: '/api-docs',
    version: API_VERSION,
  });
});

export default router;