// HSE (Health, Safety & Environment) routes
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../../types/auth';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Get HSE onboarding data for a vessel
router.get('/vessels/:vesselId/onboarding', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]),
  async (req, res) => {
    try {
      const { vesselId } = req.params;
      
      // Mock response for now - in production this would fetch from database
      const hseData = {
        id: `hse-${vesselId}`,
        vesselId,
        safetyEquipmentStatus: {
          lifeboats: { available: true, quantity: 4, lastInspection: new Date('2024-01-15'), condition: 'good' },
          lifeRafts: { available: true, quantity: 6, lastInspection: new Date('2024-01-15'), condition: 'good' },
          fireExtinguishers: { available: true, quantity: 25, lastInspection: new Date('2024-02-01'), condition: 'good' },
          fireSuits: { available: true, quantity: 10, condition: 'good' },
          emergencyBeacons: { available: true, quantity: 2, condition: 'good' },
          medicalKit: { available: true, quantity: 3, lastInspection: new Date('2024-01-20'), condition: 'good' },
          gasDetectors: { available: true, quantity: 8, condition: 'fair', notes: 'Calibration due next month' },
          breathingApparatus: { available: true, quantity: 12, lastInspection: new Date('2024-01-25'), condition: 'good' }
        },
        certificates: [],
        emergencyContacts: [],
        currentSafetyStatus: {
          lastDrillDate: new Date('2024-02-15'),
          nextDrillDate: new Date('2024-03-15'),
          openNonConformities: 2,
          lastInspectionDate: new Date('2024-01-10'),
          nextInspectionDate: new Date('2024-07-10'),
          overallRiskLevel: 'low'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json({ data: hseData });
    } catch (error) {
      res.status(500).json({ 
        code: 'HSE_FETCH_ERROR', 
        message: 'Failed to fetch HSE onboarding data' 
      });
    }
  }
);

// Update HSE onboarding data
router.put('/vessels/:vesselId/onboarding', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { vesselId } = req.params;
      const hseData = req.body;
      
      // Validate required fields
      if (!hseData.safetyEquipmentStatus) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Safety equipment status is required'
        });
      }
      
      // Mock update - in production this would update database
      const updatedData = {
        ...hseData,
        vesselId,
        lastUpdatedBy: req.user?.sub,
        lastUpdatedAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json({ 
        data: updatedData,
        message: 'HSE onboarding data updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'HSE_UPDATE_ERROR', 
        message: 'Failed to update HSE onboarding data' 
      });
    }
  }
);

// Add HSE certificate
router.post('/vessels/:vesselId/certificates', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  uploadMiddleware.single('document'),
  async (req, res) => {
    try {
      const { vesselId } = req.params;
      const certificateData = req.body;
      const file = req.file;
      
      // Validate required fields
      if (!certificateData.type || !certificateData.certificateNumber) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Certificate type and number are required'
        });
      }
      
      // Mock certificate creation
      const certificate = {
        id: `cert-${Date.now()}`,
        ...certificateData,
        vesselId,
        documentUrl: file ? `/uploads/${file.filename}` : null,
        status: new Date(certificateData.expiryDate) > new Date() ? 'valid' : 'expired',
        createdAt: new Date()
      };
      
      res.status(201).json({ 
        data: certificate,
        message: 'Certificate added successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CERTIFICATE_ADD_ERROR', 
        message: 'Failed to add certificate' 
      });
    }
  }
);

// Update HSE certificate
router.put('/certificates/:certificateId', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  uploadMiddleware.single('document'),
  async (req, res) => {
    try {
      const { certificateId } = req.params;
      const updates = req.body;
      const file = req.file;
      
      // Mock update
      const updatedCertificate = {
        id: certificateId,
        ...updates,
        documentUrl: file ? `/uploads/${file.filename}` : updates.documentUrl,
        status: new Date(updates.expiryDate) > new Date() ? 'valid' : 'expired',
        updatedAt: new Date()
      };
      
      res.json({ 
        data: updatedCertificate,
        message: 'Certificate updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CERTIFICATE_UPDATE_ERROR', 
        message: 'Failed to update certificate' 
      });
    }
  }
);

// Delete HSE certificate
router.delete('/certificates/:certificateId', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { certificateId } = req.params;
      
      // Mock deletion
      res.json({ 
        message: 'Certificate deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CERTIFICATE_DELETE_ERROR', 
        message: 'Failed to delete certificate' 
      });
    }
  }
);

// Add emergency contact
router.post('/vessels/:vesselId/emergency-contacts', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { vesselId } = req.params;
      const contactData = req.body;
      
      // Validate required fields
      if (!contactData.name || !contactData.primaryPhone || !contactData.role) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Name, role and primary phone are required'
        });
      }
      
      // Mock contact creation
      const contact = {
        id: `contact-${Date.now()}`,
        ...contactData,
        vesselId,
        createdAt: new Date()
      };
      
      res.status(201).json({ 
        data: contact,
        message: 'Emergency contact added successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CONTACT_ADD_ERROR', 
        message: 'Failed to add emergency contact' 
      });
    }
  }
);

// Update emergency contact
router.put('/emergency-contacts/:contactId', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { contactId } = req.params;
      const updates = req.body;
      
      // Mock update
      const updatedContact = {
        id: contactId,
        ...updates,
        updatedAt: new Date()
      };
      
      res.json({ 
        data: updatedContact,
        message: 'Emergency contact updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CONTACT_UPDATE_ERROR', 
        message: 'Failed to update emergency contact' 
      });
    }
  }
);

// Delete emergency contact
router.delete('/emergency-contacts/:contactId', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { contactId } = req.params;
      
      // Mock deletion
      res.json({ 
        message: 'Emergency contact deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'CONTACT_DELETE_ERROR', 
        message: 'Failed to delete emergency contact' 
      });
    }
  }
);

// Get HSE dashboard data
router.get('/dashboard', 
  authenticate, 
  authorize([UserRole.HSE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]),
  async (req, res) => {
    try {
      const { companyId } = req.user!;
      
      // Mock dashboard data
      const dashboardData = {
        vesselsCount: 5,
        certificatesExpiringSoon: 3,
        overdueInspections: 2,
        upcomingDrills: 4,
        openNonConformities: 8,
        recentActivity: [
          {
            id: '1',
            type: 'certificate_added',
            vesselName: 'MV Atlantic',
            description: 'SOLAS certificate renewed',
            timestamp: new Date('2024-02-20T10:30:00'),
            user: 'John Smith'
          },
          {
            id: '2',
            type: 'drill_completed',
            vesselName: 'MV Pacific',
            description: 'Fire drill completed successfully',
            timestamp: new Date('2024-02-19T14:15:00'),
            user: 'Jane Doe'
          }
        ]
      };
      
      res.json({ data: dashboardData });
    } catch (error) {
      res.status(500).json({ 
        code: 'DASHBOARD_ERROR', 
        message: 'Failed to fetch dashboard data' 
      });
    }
  }
);

export default router;