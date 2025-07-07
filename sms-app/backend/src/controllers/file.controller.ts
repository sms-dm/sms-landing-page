import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

export const fileController = {
  // Upload single file
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.json({
        success: true,
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          path: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  },

  // Upload multiple files
  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        path: `/uploads/${file.filename}`
      }));

      res.json({
        success: true,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  },

  // Delete file
  async deleteFile(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);

      await fs.unlink(filePath);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
};