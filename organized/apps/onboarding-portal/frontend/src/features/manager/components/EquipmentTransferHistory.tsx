import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EquipmentTransfer } from '@/types';
import { managerApi } from '../services/managerApi';
import { format } from 'date-fns';
import { ArrowRight, FileText, Package, User, Calendar, MapPin } from 'lucide-react';

interface EquipmentTransferHistoryProps {
  equipmentId: string;
}

export const EquipmentTransferHistory: React.FC<EquipmentTransferHistoryProps> = ({ equipmentId }) => {
  const [transfers, setTransfers] = useState<EquipmentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTransferHistory();
  }, [equipmentId, currentPage]);

  const loadTransferHistory = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getEquipmentTransferHistory(equipmentId, {
        page: currentPage,
        limit: 10
      });
      setTransfers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Package className="mx-auto h-12 w-12 mb-2 text-gray-400" />
          <p>No transfer history available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Transfer History</h3>
      
      <div className="space-y-3">
        {transfers.map((transfer, index) => (
          <Card key={transfer.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{transfer.fromVessel?.name || 'Unknown Vessel'}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{transfer.toVessel?.name || 'Unknown Vessel'}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(transfer.transferredAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {transfer.transferredByUser?.firstName} {transfer.transferredByUser?.lastName}
                    </span>
                  </div>
                </div>
                
                {transfer.reason && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {transfer.reason}
                    </p>
                  </div>
                )}
                
                {transfer.notes && (
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {transfer.notes}
                    </p>
                  </div>
                )}

                {transfer.fromLocation || transfer.toLocation ? (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Location:</span>{' '}
                    {transfer.fromLocation?.name || 'General'} → {transfer.toLocation?.name || 'General'}
                  </div>
                ) : null}
              </div>
              
              <Badge variant="outline" className="ml-4">
                Transfer #{index + 1}
              </Badge>
            </div>
            
            {/* Data preservation info */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{transfer.documentData ? Object.keys(transfer.documentData).length : 0} documents preserved</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>{transfer.partsData ? Object.keys(transfer.partsData).length : 0} parts preserved</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};