import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { managerApi } from '../services/managerApi';
import { CheckCircle2, XCircle, FileCheck, Package, Eye, Download, Send } from 'lucide-react';
import { ExportSuccessModal } from '../components/ExportSuccessModal';

interface VesselApproval {
  id: string;
  name: string;
  imo: string;
  equipmentCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  readyForExport: boolean;
  lastUpdated: string;
}

interface ExportPreview {
  vessel: any;
  equipment: any[];
  parts: any[];
  statistics: {
    equipmentCount: number;
    partsCount: number;
    documentsCount: number;
    photosCount: number;
  };
}

export default function ApprovalWorkflowPage() {
  const [vessels, setVessels] = useState<VesselApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVesselsForApproval();
  }, []);

  const fetchVesselsForApproval = async () => {
    try {
      const response = await managerApi.getVesselsForApproval();
      setVessels(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch vessels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewExport = async (vesselId: string) => {
    try {
      setSelectedVessel(vesselId);
      const response = await managerApi.getExportPreview(vesselId);
      setExportPreview(response.data);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate export preview',
        variant: 'destructive',
      });
    }
  };

  const handleExportToMaintenance = async () => {
    if (!selectedVessel) return;

    setExporting(true);
    try {
      const response = await managerApi.exportToMaintenancePortal(selectedVessel, {
        includePhotos: true,
        format: 'json',
      });

      // Set export result and show success modal
      setExportResult({
        exportId: response.data.exportId,
        vesselName: exportPreview?.vessel.name || '',
        maintenancePortalUrl: response.data.maintenancePortalUrl,
        statistics: {
          equipmentCount: exportPreview?.statistics.equipmentCount || 0,
          partsCount: exportPreview?.statistics.partsCount || 0,
          documentsCount: exportPreview?.statistics.documentsCount || 0,
        },
      });
      
      setShowPreview(false);
      setShowSuccess(true);
      
      // Refresh the list
      fetchVesselsForApproval();
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.response?.data?.error || 'Failed to export to maintenance portal',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const getApprovalStatus = (vessel: VesselApproval) => {
    const totalEquipment = vessel.equipmentCount;
    const approvalPercentage = (vessel.approvedCount / totalEquipment) * 100;

    if (vessel.readyForExport) {
      return { status: 'ready', color: 'text-green-600', icon: CheckCircle2 };
    } else if (vessel.rejectedCount > 0) {
      return { status: 'has-rejections', color: 'text-red-600', icon: XCircle };
    } else if (vessel.pendingCount > 0) {
      return { status: 'pending', color: 'text-yellow-600', icon: FileCheck };
    } else {
      return { status: 'not-started', color: 'text-gray-600', icon: FileCheck };
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setExportResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approval Workflow</h1>
        <p className="text-muted-foreground">Review and approve vessels for maintenance portal export</p>
      </div>

      <div className="grid gap-4">
        {vessels.map((vessel) => {
          const status = getApprovalStatus(vessel);
          const StatusIcon = status.icon;

          return (
            <Card key={vessel.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{vessel.name}</h3>
                    <span className="text-sm text-gray-500">IMO: {vessel.imo}</span>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  
                  <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Equipment:</span>
                      <span className="ml-2 font-medium">{vessel.equipmentCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Approved:</span>
                      <span className="ml-2 font-medium text-green-600">{vessel.approvedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Pending:</span>
                      <span className="ml-2 font-medium text-yellow-600">{vessel.pendingCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rejected:</span>
                      <span className="ml-2 font-medium text-red-600">{vessel.rejectedCount}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(vessel.approvedCount / vessel.equipmentCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/manager/vessels/${vessel.id}/equipment`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Review
                  </Button>
                  
                  {vessel.readyForExport && (
                    <Button
                      size="sm"
                      onClick={() => handlePreviewExport(vessel.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Export Preview
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Export Preview Modal */}
      {showPreview && exportPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Export Preview</h2>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Vessel Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Name: {exportPreview.vessel.name}</div>
                  <div>IMO: {exportPreview.vessel.imo}</div>
                  <div>Type: {exportPreview.vessel.type}</div>
                  <div>Flag: {exportPreview.vessel.flag}</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Export Statistics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Equipment: {exportPreview.statistics.equipmentCount}</div>
                  <div>Parts: {exportPreview.statistics.partsCount}</div>
                  <div>Documents: {exportPreview.statistics.documentsCount}</div>
                  <div>Photos: {exportPreview.statistics.photosCount}</div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Equipment Summary</h3>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Criticality</th>
                        <th className="text-left p-2">Parts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportPreview.equipment.slice(0, 10).map((eq) => (
                        <tr key={eq.id} className="border-b">
                          <td className="p-2">{eq.name}</td>
                          <td className="p-2">{eq.type || '-'}</td>
                          <td className="p-2">{eq.criticality}</td>
                          <td className="p-2">{eq.partsCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportPreview.equipment.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      And {exportPreview.equipment.length - 10} more...
                    </p>
                  )}
                </div>
              </Card>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This export will transfer all approved equipment data to the
                  maintenance portal. The onboarding data will be marked as exported and locked.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportToMaintenance}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {exporting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Export to Maintenance Portal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <ExportSuccessModal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        exportData={exportResult}
      />
    </div>
  );
}