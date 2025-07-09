import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { managerApi } from '../services/managerApi';
import {
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  ChevronLeft,
  Eye,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  code: string;
  equipmentType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  criticality: string;
  status: string;
  qualityScore: number;
  location: {
    name: string;
    path: string;
  };
  criticalParts: any[];
  documents: any[];
  documentedByUser: {
    firstName: string;
    lastName: string;
  };
  documentedAt: string;
}

export default function VesselEquipmentReviewPage() {
  const { vesselId } = useParams<{ vesselId: string }>();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (vesselId) {
      fetchEquipment();
    }
  }, [vesselId]);

  const fetchEquipment = async () => {
    try {
      const response = await managerApi.getEquipmentForReview(vesselId!);
      setEquipment(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch equipment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (equipmentId: string) => {
    setProcessingId(equipmentId);
    try {
      await managerApi.approveEquipment(equipmentId);
      toast({
        title: 'Success',
        description: 'Equipment approved successfully',
      });
      fetchEquipment();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve equipment',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedEquipment || !rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(selectedEquipment.id);
    try {
      await managerApi.rejectEquipment(selectedEquipment.id, rejectReason);
      toast({
        title: 'Success',
        description: 'Equipment rejected',
      });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedEquipment(null);
      fetchEquipment();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject equipment',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      DOCUMENTED: { color: 'bg-blue-100 text-blue-800', icon: FileText },
      REVIEWED: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getCriticalityBadge = (criticality: string) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800',
      IMPORTANT: 'bg-orange-100 text-orange-800',
      STANDARD: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[criticality as keyof typeof colors]}`}>
        {criticality}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manager/approval')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Approval
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Equipment Review</h1>
            <p className="text-muted-foreground">Review and approve equipment for export</p>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Total Equipment: {equipment.length}
        </div>
      </div>

      <div className="grid gap-4">
        {equipment.map((eq) => (
          <Card key={eq.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{eq.name}</h3>
                  {getStatusBadge(eq.status)}
                  {getCriticalityBadge(eq.criticality)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Type:</span> {eq.equipmentType || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Code:</span> {eq.code || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Manufacturer:</span> {eq.manufacturer || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span> {eq.model || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Serial Number:</span> {eq.serialNumber || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {eq.location?.name || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{eq.criticalParts.length} Parts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span>{eq.documents.length} Photos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span>Quality Score: {eq.qualityScore}%</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Documented by {eq.documentedByUser?.firstName} {eq.documentedByUser?.lastName} on{' '}
                  {new Date(eq.documentedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {eq.status !== 'APPROVED' && eq.status !== 'REJECTED' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEquipment(eq);
                        setShowRejectDialog(true);
                      }}
                      disabled={processingId === eq.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(eq.id)}
                      disabled={processingId === eq.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Equipment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedEquipment?.name}"
            </p>
            <textarea
              className="w-full border rounded-md p-2 mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                  setSelectedEquipment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === selectedEquipment?.id}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Equipment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}