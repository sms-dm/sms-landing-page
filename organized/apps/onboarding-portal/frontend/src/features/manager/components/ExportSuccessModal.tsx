import { CheckCircle2, ExternalLink, FileCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: {
    exportId: string;
    vesselName: string;
    maintenancePortalUrl?: string;
    statistics: {
      equipmentCount: number;
      partsCount: number;
      documentsCount: number;
    };
  };
}

export function ExportSuccessModal({ isOpen, onClose, exportData }: ExportSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Export Successful!</h2>
          <p className="text-gray-600 mb-6">
            {exportData.vesselName} has been successfully exported to the Maintenance Portal
          </p>

          <Card className="w-full p-4 mb-6 bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="font-semibold">{exportData.statistics.equipmentCount}</div>
                <div className="text-gray-500">Equipment</div>
              </div>
              <div className="text-center">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="font-semibold">{exportData.statistics.partsCount}</div>
                <div className="text-gray-500">Parts</div>
              </div>
              <div className="text-center">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="font-semibold">{exportData.statistics.documentsCount}</div>
                <div className="text-gray-500">Documents</div>
              </div>
            </div>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 w-full">
            <p className="text-sm text-blue-800">
              <strong>Export ID:</strong> {exportData.exportId}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            {exportData.maintenancePortalUrl && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open(exportData.maintenancePortalUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View in Maintenance Portal
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportSuccessModal;