import { Request, Response } from 'express';
import { CertificateService } from '../services/certificate.service';

export class CertificateController {
  // Create new certificate
  static async createCertificate(req: Request, res: Response) {
    try {
      const certificateData = req.body;
      const userId = req.user.id;

      if (!certificateData.equipmentId || !certificateData.certificateType || 
          !certificateData.certificateNumber || !certificateData.expiryDate) {
        return res.status(400).json({ 
          error: 'Missing required fields: equipmentId, certificateType, certificateNumber, expiryDate' 
        });
      }

      const certificateId = await CertificateService.createCertificate(certificateData, userId);

      res.status(201).json({
        success: true,
        certificateId,
        message: 'Certificate tracking created successfully'
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      res.status(500).json({ error: 'Failed to create certificate tracking' });
    }
  }

  // Renew certificate
  static async renewCertificate(req: Request, res: Response) {
    try {
      const { certificateId } = req.params;
      const renewalData = {
        ...req.body,
        certificateId: parseInt(certificateId),
        renewedBy: req.user.id
      };

      if (!renewalData.newCertificateNumber || !renewalData.newExpiryDate) {
        return res.status(400).json({ 
          error: 'Missing required fields: newCertificateNumber, newExpiryDate' 
        });
      }

      await CertificateService.renewCertificate(renewalData);

      res.json({
        success: true,
        message: 'Certificate renewed successfully'
      });
    } catch (error) {
      console.error('Error renewing certificate:', error);
      res.status(500).json({ error: 'Failed to renew certificate' });
    }
  }

  // Get vessel certificate compliance
  static async getVesselCompliance(req: Request, res: Response) {
    try {
      const { vesselId } = req.params;
      const compliance = await CertificateService.getVesselCertificateCompliance(parseInt(vesselId));

      res.json({
        success: true,
        data: compliance
      });
    } catch (error) {
      console.error('Error getting vessel compliance:', error);
      res.status(500).json({ error: 'Failed to get vessel compliance' });
    }
  }

  // Get equipment certificates
  static async getEquipmentCertificates(req: Request, res: Response) {
    try {
      const { equipmentId } = req.params;
      const certificates = await CertificateService.getEquipmentCertificates(parseInt(equipmentId));

      res.json({
        success: true,
        data: certificates
      });
    } catch (error) {
      console.error('Error getting equipment certificates:', error);
      res.status(500).json({ error: 'Failed to get equipment certificates' });
    }
  }

  // Get certificate warnings summary
  static async getWarningsSummary(req: Request, res: Response) {
    try {
      const { vesselId } = req.query;
      const summary = await CertificateService.getCertificateWarningsSummary(
        vesselId ? parseInt(vesselId as string) : undefined
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting warnings summary:', error);
      res.status(500).json({ error: 'Failed to get warnings summary' });
    }
  }

  // Acknowledge certificate warning
  static async acknowledgeWarning(req: Request, res: Response) {
    try {
      const { warningId } = req.params;
      const userId = req.user.id;

      await CertificateService.acknowledgeCertificateWarning(parseInt(warningId), userId);

      res.json({
        success: true,
        message: 'Warning acknowledged successfully'
      });
    } catch (error) {
      console.error('Error acknowledging warning:', error);
      res.status(500).json({ error: 'Failed to acknowledge warning' });
    }
  }

  // Get certificate calendar events
  static async getCalendarEvents(req: Request, res: Response) {
    try {
      const { startDate, endDate, vesselId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Missing required parameters: startDate, endDate' 
        });
      }

      const events = await CertificateService.getCertificateCalendarEvents(
        startDate as string,
        endDate as string,
        vesselId ? parseInt(vesselId as string) : undefined
      );

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('Error getting calendar events:', error);
      res.status(500).json({ error: 'Failed to get calendar events' });
    }
  }

  // Manually trigger certificate warnings check
  static async checkWarnings(req: Request, res: Response) {
    try {
      await CertificateService.updateAllCertificateWarnings();

      res.json({
        success: true,
        message: 'Certificate warnings check completed'
      });
    } catch (error) {
      console.error('Error checking warnings:', error);
      res.status(500).json({ error: 'Failed to check certificate warnings' });
    }
  }
}