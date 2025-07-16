import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Equipment, EquipmentStatus, EquipmentClassification, CriticalityLevel, PaginatedResponse, EquipmentTransfer } from '@/types';
import { managerApi } from '../services/managerApi';
import { EquipmentTransferModal } from '../components/EquipmentTransferModal';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  ArrowUpDown,
  Loader2,
  AlertCircle,
  History,
  ArrowRightLeft,
  Package,
  Anchor,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function EquipmentReviewPage() {
  const { vesselId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [transfers, setTransfers] = useState<EquipmentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [classificationFilter, setClassificationFilter] = useState(searchParams.get('classification') || '');
  const [criticalityFilter, setCriticalityFilter] = useState(searchParams.get('criticality') || '');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadEquipment();
  }, [vesselId, currentPage, searchTerm, statusFilter, classificationFilter, criticalityFilter]);

  useEffect(() => {
    if (activeTab === 'transfers') {
      loadTransferHistory();
    }
  }, [activeTab, vesselId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Equipment> = await managerApi.getVesselEquipment(vesselId!, {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        classification: classificationFilter || undefined,
        criticalLevel: criticalityFilter || undefined,
      });
      
      setEquipment(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransferHistory = async () => {
    try {
      // This would need a different API endpoint to get all transfers for a vessel
      // For now, we'll just show a placeholder
      setTransfers([]);
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    }
  };

  const handleTransferClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    loadEquipment();
    setShowTransferModal(false);
    setSelectedEquipment(null);
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    const statusConfig = {
      [EquipmentStatus.DRAFT]: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      [EquipmentStatus.PENDING_REVIEW]: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700' },
      [EquipmentStatus.APPROVED]: { label: 'Approved', className: 'bg-green-100 text-green-700' },
      [EquipmentStatus.REJECTED]: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    };
    
    const config = statusConfig[status] || statusConfig[EquipmentStatus.DRAFT];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getClassificationIcon = (classification: EquipmentClassification) => {
    switch (classification) {
      case EquipmentClassification.PERMANENT:
        return <Anchor className="h-4 w-4" />;
      case EquipmentClassification.FLOATING:
        return <Package className="h-4 w-4" />;
      case EquipmentClassification.RENTAL:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCriticalityBadge = (level: CriticalityLevel) => {
    const criticalityConfig = {
      [CriticalityLevel.CRITICAL]: { label: 'Critical', className: 'bg-red-100 text-red-700' },
      [CriticalityLevel.HIGH]: { label: 'High', className: 'bg-orange-100 text-orange-700' },
      [CriticalityLevel.MEDIUM]: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
      [CriticalityLevel.LOW]: { label: 'Low', className: 'bg-green-100 text-green-700' },
    };
    
    const config = criticalityConfig[level];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">Review and manage vessel equipment</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Equipment</TabsTrigger>
          <TabsTrigger value="review">Pending Review</TabsTrigger>
          <TabsTrigger value="transfers">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {Object.values(EquipmentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classifications</SelectItem>
                  {Object.values(EquipmentClassification).map((classification) => (
                    <SelectItem key={classification} value={classification}>
                      {classification.charAt(0).toUpperCase() + classification.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Criticality Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Criticality Levels</SelectItem>
                  {Object.values(CriticalityLevel).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Equipment List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : equipment.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No equipment found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your filters or search criteria</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium">{item.name}</h3>
                        {getStatusBadge(item.status)}
                        {getCriticalityBadge(item.criticalityLevel)}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getClassificationIcon(item.classification)}
                          <span>{item.classification}</span>
                        </div>
                      </div>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Manufacturer:</span> {item.manufacturer}
                        </div>
                        <div>
                          <span className="font-medium">Model:</span> {item.model}
                        </div>
                        <div>
                          <span className="font-medium">Serial:</span> {item.serialNumber}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {item.location}
                        </div>
                      </div>
                      {item.qualityScore > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Quality Score:</span>
                            <div className="flex-1 max-w-xs">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    item.qualityScore >= 80 ? 'bg-green-500' :
                                    item.qualityScore >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${item.qualityScore}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium">{item.qualityScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.classification !== EquipmentClassification.PERMANENT && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransferClick(item)}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Transfer
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      {item.status === EquipmentStatus.PENDING_REVIEW && (
                        <>
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {equipment.length} of {totalItems} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review">
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Pending Review Items</h3>
              <p className="mt-1 text-gray-500">Equipment awaiting review will appear here</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card className="p-8">
            <div className="text-center">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Equipment Transfer History</h3>
              <p className="mt-1 text-gray-500">All equipment transfers for this vessel will appear here</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Modal */}
      {selectedEquipment && (
        <EquipmentTransferModal
          equipment={selectedEquipment}
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}