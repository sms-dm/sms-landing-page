// File upload middleware using multer
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = config.security.allowedFileTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.security.maxFileSize,
    files: 10, // Maximum number of files
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds the maximum limit of ${config.security.maxFileSize} bytes`,
          });
        }
        return res.status(400).json({
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          code: 'FILE_TYPE_ERROR',
          message: err.message,
        });
      }
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds the maximum limit of ${config.security.maxFileSize} bytes`,
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            code: 'TOO_MANY_FILES',
            message: `Maximum ${maxCount} files allowed`,
          });
        }
        return res.status(400).json({
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          code: 'FILE_TYPE_ERROR',
          message: err.message,
        });
      }
      next();
    });
  };
};

// Upload fields middleware for different file types
export const uploadFields = (fields: multer.Field[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds the maximum limit of ${config.security.maxFileSize} bytes`,
          });
        }
        return res.status(400).json({
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          code: 'FILE_TYPE_ERROR',
          message: err.message,
        });
      }
      next();
    });
  };
};