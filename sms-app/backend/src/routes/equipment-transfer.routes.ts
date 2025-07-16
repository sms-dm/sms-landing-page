import { Router } from 'express';
import { 
  transferEquipment,
  getEquipmentTransferHistory,
  getVesselTransfers,
  getTransferableEquipment,
  cancelTransfer
} from '../controllers/equipment-transfer.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Transfer equipment
router.post('/transfer', transferEquipment);

// Get transfer history for specific equipment
router.get('/equipment/:equipmentId/history', getEquipmentTransferHistory);

// Get all transfers for a vessel
router.get('/vessel/:vesselId', getVesselTransfers);

// Get transferable equipment for a vessel
router.get('/vessel/:vesselId/transferable', getTransferableEquipment);

// Cancel a pending transfer
router.post('/transfer/:transferId/cancel', cancelTransfer);

export default router;