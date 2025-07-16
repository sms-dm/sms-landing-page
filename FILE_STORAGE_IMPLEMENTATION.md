# File Storage Implementation for SMS Portals

## Overview

Both SMS portals now have working file storage solutions that:
- Store files locally in development
- Can easily migrate to AWS S3 in production
- Support equipment documents, photos, manuals, and certificates
- Enable file transfers between portals during equipment export/import

## Architecture

### 1. Maintenance Portal (sms-app)
- **Storage Service**: `/backend/src/services/file-storage.service.ts`
- **Upload Middleware**: `/backend/src/middleware/upload.middleware.ts`
- **File Controller**: `/backend/src/controllers/file.controller.ts`
- **Routes**: `/backend/src/routes/file.routes.ts`
- **Database Table**: `equipment_documents`

### 2. Onboarding Portal (SMS-Onboarding-Unified)
- **Storage Service**: `/backend/services/s3.service.ts` (supports both local and S3)
- **Upload Middleware**: `/backend/api/middleware/upload.middleware.ts`
- **File Controller**: `/backend/api/controllers/file.controller.ts`
- **Routes**: `/backend/api/routes/file.routes.ts`
- **Database Table**: `documents` (Prisma model)

## File Storage Structure

```
uploads/
├── equipment/      # Equipment-related files
├── documents/      # General documents
└── temp/          # Temporary files
```

## API Endpoints

### Maintenance Portal (http://localhost:3005)
- `POST /api/files/equipment/:equipmentId/upload` - Upload single file
- `POST /api/files/equipment/:equipmentId/upload-multiple` - Upload multiple files
- `GET /api/files/equipment/:equipmentId/documents` - Get equipment documents
- `GET /api/files/download/:documentId` - Download file
- `DELETE /api/files/document/:documentId` - Delete document

### Onboarding Portal (http://localhost:3000)
- `POST /api/files/equipment/:equipmentId/upload` - Upload single file
- `POST /api/files/equipment/:equipmentId/upload-multiple` - Upload multiple files
- `GET /api/files/equipment/:equipmentId/documents` - Get equipment documents
- `GET /api/files/download/:documentId` - Download file
- `DELETE /api/files/document/:documentId` - Delete document
- `GET /api/files/` - Get all files (admin)

## Supported File Types
- Images: JPEG, JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT
- JSON files for data export/import

## Local Storage Configuration

Both portals serve static files from the `/uploads` directory:
- Maintenance Portal: `http://localhost:3005/uploads/...`
- Onboarding Portal: `http://localhost:3000/uploads/...`

## S3 Migration Path

The Onboarding portal already has S3 support built-in. To migrate:

1. Set environment variables:
   ```env
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=sms-uploads
   ```

2. The s3.service.ts automatically switches to S3 when credentials are provided

3. For the Maintenance portal, update the file-storage.service.ts to use S3:
   - Implement the S3 upload/download methods
   - Update the `useLocal` flag based on environment

## File Transfer Between Portals

When exporting equipment data from the Onboarding portal:
1. The export service includes file references in the manifest
2. File metadata is exported in JSON format
3. The Maintenance portal can import these references
4. Files can be re-uploaded or linked to existing S3 resources

## Security Considerations

1. **Authentication**: All file endpoints require authentication
2. **File Size Limits**: 10MB max per file
3. **File Type Validation**: Only allowed MIME types accepted
4. **Path Traversal Protection**: Files stored with UUID-based names

## Testing

Use the provided test script:
```bash
node test-file-upload.js
```

This tests:
- File upload to both portals
- File download functionality
- Authentication flow

## Next Steps

1. **Implement file copying during equipment transfer**
   - When equipment is transferred between vessels
   - Copy associated documents to new location

2. **Add thumbnail generation for images**
   - Generate thumbnails for photo uploads
   - Store in separate thumbnail directory

3. **Implement file compression**
   - Compress large files before storage
   - Decompress on download

4. **Add virus scanning**
   - Scan uploaded files for malware
   - Quarantine suspicious files

5. **Implement CDN integration**
   - Serve files through CloudFront or similar
   - Improve global access performance

## Troubleshooting

### Common Issues

1. **Upload fails with "No file uploaded"**
   - Ensure form field name matches endpoint expectation
   - Check multipart/form-data content type

2. **Download returns 404**
   - Verify file exists in uploads directory
   - Check file path in database matches actual location

3. **Permission errors**
   - Ensure uploads directory has write permissions
   - Check user has appropriate role for file operations

### Debug Commands

```bash
# Check upload directories
ls -la sms-app/backend/uploads/
ls -la SMS-Onboarding-Unified/backend/uploads/

# Check file permissions
chmod -R 755 sms-app/backend/uploads/
chmod -R 755 SMS-Onboarding-Unified/backend/uploads/

# Monitor upload activity
tail -f sms-app/backend/maintenance-backend.log
tail -f SMS-Onboarding-Unified/backend/onboarding-backend.log
```