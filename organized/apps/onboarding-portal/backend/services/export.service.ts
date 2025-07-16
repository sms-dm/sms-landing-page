import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.service';
import { s3Service } from './s3.service';

const prisma = new PrismaClient();

interface ExportOptions {
  vesselId: string;
  includePhotos: boolean;
  format: 'zip' | 'tar';
  userId: string;
}

interface ExportResult {
  exportId: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  manifest: ExportManifest;
}

interface ExportManifest {
  version: string;
  exportId: string;
  exportDate: string;
  vessel: {
    id: string;
    name: string;
    imo: string;
  };
  statistics: {
    equipmentCount: number;
    partsCount: number;
    documentsCount: number;
    photosCount: number;
  };
  structure: {
    directories: string[];
    files: FileEntry[];
  };
}

interface FileEntry {
  path: string;
  type: string;
  size: number;
  checksum?: string;
}

export class ExportService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'exports');
  }

  async createExportPackage(options: ExportOptions): Promise<ExportResult> {
    const exportId = uuidv4();
    const exportDir = path.join(this.tempDir, exportId);

    try {
      // Create export directory structure
      await this.createDirectoryStructure(exportDir);

      // Fetch vessel data
      const vessel = await this.fetchVesselData(options.vesselId);
      if (!vessel) {
        throw new Error('Vessel not found');
      }

      // Create manifest
      const manifest = await this.createManifest(exportId, vessel);

      // Export data files
      await this.exportVesselInfo(exportDir, vessel);
      await this.exportEquipment(exportDir, vessel.equipment);
      await this.exportParts(exportDir, vessel.equipment);
      await this.exportLocations(exportDir, vessel.locations);

      // Export documents and photos if requested
      if (options.includePhotos) {
        await this.exportDocuments(exportDir, vessel.equipment);
      }

      // Write manifest
      await fs.writeFile(
        path.join(exportDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Create archive
      const archivePath = await this.createArchive(exportDir, exportId, options.format);

      // Calculate file size and checksum
      const stats = await fs.stat(archivePath);
      const checksum = await this.calculateChecksum(archivePath);

      // Clean up temp directory
      await this.cleanupDirectory(exportDir);

      // Update manifest with final details
      manifest.structure = await this.getDirectoryStructure(exportDir);

      return {
        exportId,
        filePath: archivePath,
        fileSize: stats.size,
        checksum,
        manifest,
      };
    } catch (error) {
      // Clean up on error
      await this.cleanupDirectory(exportDir);
      throw error;
    }
  }

  private async createDirectoryStructure(baseDir: string): Promise<void> {
    const directories = [
      '',
      'vessel',
      'equipment',
      'equipment/specifications',
      'equipment/maintenance',
      'parts',
      'parts/inventory',
      'locations',
      'documents',
      'documents/images',
      'documents/manuals',
      'documents/certificates',
      'quality',
      'reports',
    ];

    for (const dir of directories) {
      await fs.mkdir(path.join(baseDir, dir), { recursive: true });
    }
  }

  private async fetchVesselData(vesselId: string): Promise<any> {
    return await prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        company: true,
        locations: {
          orderBy: { sortOrder: 'asc' },
        },
        equipment: {
          where: { status: 'APPROVED' },
          include: {
            criticalParts: true,
            documents: true,
            qualityScores: true,
            location: true,
          },
        },
      },
    });
  }

  private async createManifest(exportId: string, vessel: any): Promise<ExportManifest> {
    const equipmentCount = vessel.equipment.length;
    const partsCount = vessel.equipment.reduce(
      (sum: number, eq: any) => sum + eq.criticalParts.length,
      0
    );
    const documentsCount = vessel.equipment.reduce(
      (sum: number, eq: any) => sum + eq.documents.length,
      0
    );
    const photosCount = vessel.equipment.reduce(
      (sum: number, eq: any) =>
        sum + eq.documents.filter((d: any) => d.documentType === 'IMAGE').length,
      0
    );

    return {
      version: '1.0',
      exportId,
      exportDate: new Date().toISOString(),
      vessel: {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.imoNumber,
      },
      statistics: {
        equipmentCount,
        partsCount,
        documentsCount,
        photosCount,
      },
      structure: {
        directories: [],
        files: [],
      },
    };
  }

  private async exportVesselInfo(exportDir: string, vessel: any): Promise<void> {
    const vesselInfo = {
      id: vessel.id,
      name: vessel.name,
      imo: vessel.imoNumber,
      type: vessel.vesselType,
      flag: vessel.flag,
      yearBuilt: vessel.yearBuilt,
      grossTonnage: vessel.grossTonnage,
      specifications: vessel.metadata,
      company: {
        id: vessel.company.id,
        name: vessel.company.name,
        code: vessel.company.code,
      },
      onboardingStatus: vessel.onboardingStatus,
      metadata: vessel.metadata,
    };

    await fs.writeFile(
      path.join(exportDir, 'vessel', 'vessel-info.json'),
      JSON.stringify(vesselInfo, null, 2)
    );
  }

  private async exportEquipment(exportDir: string, equipment: any[]): Promise<void> {
    // Export equipment list
    const equipmentList = equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      code: eq.code,
      type: eq.equipmentType,
      manufacturer: eq.manufacturer,
      model: eq.model,
      serialNumber: eq.serialNumber,
      criticality: eq.criticality,
      locationId: eq.locationId,
      locationPath: eq.location?.path,
    }));

    await fs.writeFile(
      path.join(exportDir, 'equipment', 'equipment-list.json'),
      JSON.stringify(equipmentList, null, 2)
    );

    // Export individual equipment details
    for (const eq of equipment) {
      const equipmentDetail = {
        ...eq,
        criticalParts: undefined,
        documents: undefined,
      };

      await fs.writeFile(
        path.join(exportDir, 'equipment', 'specifications', `${eq.id}.json`),
        JSON.stringify(equipmentDetail, null, 2)
      );

      // Export maintenance schedule
      if (eq.maintenanceIntervalDays) {
        const maintenanceInfo = {
          equipmentId: eq.id,
          equipmentName: eq.name,
          intervalDays: eq.maintenanceIntervalDays,
          lastMaintenance: eq.lastMaintenanceDate,
          nextMaintenance: eq.nextMaintenanceDate,
        };

        await fs.writeFile(
          path.join(exportDir, 'equipment', 'maintenance', `${eq.id}-schedule.json`),
          JSON.stringify(maintenanceInfo, null, 2)
        );
      }
    }
  }

  private async exportParts(exportDir: string, equipment: any[]): Promise<void> {
    const allParts: any[] = [];

    for (const eq of equipment) {
      for (const part of eq.criticalParts) {
        const partData = {
          ...part,
          equipmentId: eq.id,
          equipmentName: eq.name,
        };
        allParts.push(partData);

        // Export individual part file
        await fs.writeFile(
          path.join(exportDir, 'parts', `${part.id}.json`),
          JSON.stringify(partData, null, 2)
        );
      }
    }

    // Export parts inventory summary
    const inventory = allParts.map((p) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      equipmentId: p.equipmentId,
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      criticality: p.criticality,
    }));

    await fs.writeFile(
      path.join(exportDir, 'parts', 'inventory', 'inventory-summary.json'),
      JSON.stringify(inventory, null, 2)
    );
  }

  private async exportLocations(exportDir: string, locations: any[]): Promise<void> {
    // Build location hierarchy
    const locationHierarchy = this.buildLocationHierarchy(locations);

    await fs.writeFile(
      path.join(exportDir, 'locations', 'location-hierarchy.json'),
      JSON.stringify(locationHierarchy, null, 2)
    );

    // Export flat location list
    await fs.writeFile(
      path.join(exportDir, 'locations', 'location-list.json'),
      JSON.stringify(locations, null, 2)
    );
  }

  private async exportDocuments(exportDir: string, equipment: any[]): Promise<void> {
    const documentIndex: any[] = [];

    for (const eq of equipment) {
      for (const doc of eq.documents) {
        documentIndex.push({
          id: doc.id,
          equipmentId: eq.id,
          equipmentName: eq.name,
          type: doc.documentType,
          name: doc.name,
          originalPath: doc.filePath,
        });

        // In a real implementation, we would download the file from S3
        // For now, we'll just create a reference file
        const docRef = {
          id: doc.id,
          name: doc.name,
          type: doc.documentType,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          s3Path: doc.filePath,
          uploadedAt: doc.uploadedAt,
        };

        const subDir = this.getDocumentSubdirectory(doc.documentType);
        await fs.writeFile(
          path.join(exportDir, 'documents', subDir, `${doc.id}-ref.json`),
          JSON.stringify(docRef, null, 2)
        );
      }
    }

    // Write document index
    await fs.writeFile(
      path.join(exportDir, 'documents', 'document-index.json'),
      JSON.stringify(documentIndex, null, 2)
    );
  }

  private buildLocationHierarchy(locations: any[]): any[] {
    const locationMap = new Map(locations.map((loc) => [loc.id, { ...loc, children: [] }]));
    const roots: any[] = [];

    locations.forEach((location) => {
      if (location.parentId) {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children.push(locationMap.get(location.id));
        }
      } else {
        roots.push(locationMap.get(location.id));
      }
    });

    return roots;
  }

  private getDocumentSubdirectory(documentType: string): string {
    const typeMap: Record<string, string> = {
      IMAGE: 'images',
      PDF: 'manuals',
      MANUAL: 'manuals',
      CERTIFICATE: 'certificates',
      OTHER: '',
    };
    return typeMap[documentType] || '';
  }

  private async createArchive(
    sourceDir: string,
    exportId: string,
    format: 'zip' | 'tar'
  ): Promise<string> {
    const extension = format === 'zip' ? 'zip' : 'tar.gz';
    const archivePath = path.join(this.tempDir, `export-${exportId}.${extension}`);
    const output = createWriteStream(archivePath);

    const archive =
      format === 'zip'
        ? archiver('zip', { zlib: { level: 9 } })
        : archiver('tar', { gzip: true });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(archivePath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    // In production, implement proper checksum calculation
    return 'checksum-placeholder';
  }

  private async getDirectoryStructure(dir: string): Promise<any> {
    // In production, implement directory structure scanning
    return {
      directories: [],
      files: [],
    };
  }

  private async cleanupDirectory(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      logger.error('Failed to cleanup directory', { dir, error });
    }
  }
}

export const exportService = new ExportService();