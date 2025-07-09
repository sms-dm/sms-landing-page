import React, { useState, useEffect } from 'react';
import { Shield, Calendar, History, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  VerificationDashboard, 
  PerformVerificationDialog,
  VerificationNotifications 
} from '../components';
import { verificationService, EquipmentDue, VerificationHistory } from '@/services/verification';
import { useToast } from '@/utils/toast';
import { format } from 'date-fns';

export const VerificationManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentDue | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyPage]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await verificationService.getVerificationHistory({
        limit: 20,
        offset: historyPage * 20,
      });
      setHistory(data.verifications);
      setTotalHistory(data.total);
    } catch (error) {
      console.error('Error loading verification history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification history',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVerifyEquipment = (equipment: EquipmentDue) => {
    setSelectedEquipment(equipment);
    setShowVerificationDialog(true);
  };

  const handleVerificationComplete = () => {
    // Refresh the dashboard
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Verification Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <VerificationNotifications />
              <Button
                onClick={() => window.location.href = '/dashboard/equipment'}
                variant="outline"
              >
                Equipment List
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' ? (
          <VerificationDashboard
            onVerifyEquipment={handleVerifyEquipment}
          />
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Verification History</h2>
            
            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No verification history found
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((verification) => (
                  <div
                    key={verification.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{verification.equipment.name}</h3>
                        <p className="text-sm text-gray-600">
                          {verification.equipment.vessel.name} • 
                          {verification.equipment.code || 'No code'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            {format(new Date(verification.verificationDate), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            verification.verificationType === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-700'
                              : verification.verificationType === 'CORRECTIVE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {verification.verificationType}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Quality:</span>
                          <span className={`font-medium ${
                            verification.qualityScoreBefore < verification.qualityScoreAfter
                              ? 'text-green-600'
                              : verification.qualityScoreBefore > verification.qualityScoreAfter
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {verification.qualityScoreBefore}% → {verification.qualityScoreAfter}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          By {verification.verifiedByUser.firstName} {verification.verifiedByUser.lastName}
                        </p>
                      </div>
                    </div>
                    
                    {(verification.findings || verification.correctiveActions) && (
                      <div className="mt-3 pt-3 border-t">
                        {verification.findings && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700">Findings:</p>
                            <p className="text-sm text-gray-600">{verification.findings}</p>
                          </div>
                        )}
                        {verification.correctiveActions && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Corrective Actions:</p>
                            <p className="text-sm text-gray-600">{verification.correctiveActions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalHistory > 20 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {historyPage * 20 + 1} - {Math.min((historyPage + 1) * 20, totalHistory)} of {totalHistory}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(prev => Math.max(0, prev - 1))}
                    disabled={historyPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(prev => prev + 1)}
                    disabled={(historyPage + 1) * 20 >= totalHistory}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Verification Dialog */}
      {selectedEquipment && (
        <PerformVerificationDialog
          equipment={selectedEquipment}
          isOpen={showVerificationDialog}
          onClose={() => {
            setShowVerificationDialog(false);
            setSelectedEquipment(null);
          }}
          onSuccess={handleVerificationComplete}
        />
      )}
    </div>
  );
};