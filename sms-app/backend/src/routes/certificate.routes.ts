import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permissions.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create new certificate tracking
router.post('/certificates', 
  checkPermission('equipment', 'update'),
  CertificateController.createCertificate
);

// Renew certificate
router.post('/certificates/:certificateId/renew', 
  checkPermission('equipment', 'update'),
  CertificateController.renewCertificate
);

// Get vessel certificate compliance
router.get('/vessels/:vesselId/certificate-compliance', 
  checkPermission('equipment', 'read'),
  CertificateController.getVesselCompliance
);

// Get equipment certificates
router.get('/equipment/:equipmentId/certificates', 
  checkPermission('equipment', 'read'),
  CertificateController.getEquipmentCertificates
);

// Get certificate warnings summary
router.get('/certificate-warnings/summary', 
  checkPermission('equipment', 'read'),
  CertificateController.getWarningsSummary
);

// Acknowledge certificate warning
router.put('/certificate-warnings/:warningId/acknowledge', 
  checkPermission('equipment', 'update'),
  CertificateController.acknowledgeWarning
);

// Get certificate calendar events
router.get('/certificate-calendar', 
  checkPermission('equipment', 'read'),
  CertificateController.getCalendarEvents
);

// Manually trigger certificate warnings check (admin only)
router.post('/certificate-warnings/check', 
  checkPermission('admin', 'manage'),
  CertificateController.checkWarnings
);

export default router;