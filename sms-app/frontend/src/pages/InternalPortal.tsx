import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiBell, 
  FiAlertTriangle, 
  FiPackage, 
  FiTrendingUp, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiInfo, 
  FiShoppingCart, 
  FiX, 
  FiSend, 
  FiDollarSign, 
  FiUsers, 
  FiFileText, 
  FiCheckSquare, 
  FiAnchor, 
  FiActivity, 
  FiBarChart2, 
  FiTrendingDown, 
  FiMapPin, 
  FiAlertOctagon,
  FiLogOut,
  FiMessageSquare,
  FiSettings,
  FiKey 
} from 'react-icons/fi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, Scatter, Treemap
} from 'recharts';

interface EmergencyOrder {
  id: string;
  vessel: string;
  part: string;
  partNumber: string;
  timeRequested: Date;
  urgencyLevel: 'critical' | 'high' | 'medium';
}

interface LowStockAlert {
  id: string;
  part: string;
  partNumber: string;
  currentStock: number;
  threshold: number;
  affectedVessels: string[];
}

interface ReorderRecommendation {
  id: string;
  part: string;
  partNumber: string;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  estimatedStockoutDays: number;
}

interface Notification {
  id: string;
  type: 'emergency' | 'reorder' | 'availability';
  message: string;
  timestamp: Date;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface PartUsageTrend {
  part: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  percentageChange: number;
  forecastedDemand: number;
}

interface SupplierMetric {
  supplier: string;
  onTimeDelivery: number;
  qualityScore: number;
  avgLeadTime: number;
}

interface RevenueData {
  month: string;
  mrr: number;
  partsSales: number;
  total: number;
}

interface ClientActivity {
  company: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface SystemMetric {
  time: string;
  responseTime: number;
  uptime: number;
  apiCalls: number;
}

interface PartSale {
  name: string;
  revenue: number;
  quantity: number;
  actualCost: number;
  margin: number;
}

interface UserEngagement {
  date: string;
  logins: number;
  orders: number;
  searches: number;
}

interface Vessel {
  id: string;
  name: string;
  company: string;
  healthScore: number;
  activeIssues: number;
  lat: number;
  lng: number;
  status: 'operational' | 'maintenance' | 'critical';
}

interface ForecastData {
  month: string;
  predicted: number;
  lower: number;
  upper: number;
}

interface ChurnRisk {
  company: string;
  riskScore: number;
  lastActivity: number;
  orderFrequency: number;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  preferred: boolean;
}

interface Quote {
  id: string;
  supplierId: string;
  supplierName: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadTime: number;
  dateReceived: Date;
  status: 'pending' | 'received' | 'approved' | 'sent_to_client';
}

interface ProcurementRequest {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  specs: string;
  requestedBy: string;
  dateRequested: Date;
  quotes: Quote[];
  clientPrice?: number;
  status: 'quote_requested' | 'quotes_received' | 'sent_to_client' | 'order_confirmed';
}

const InternalPortal: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Mock data - in real implementation, these would come from API calls
  const [emergencyOrders] = useState<EmergencyOrder[]>([
    {
      id: '1',
      vessel: 'MV Sea Explorer',
      part: 'Main Engine Bearing',
      partNumber: 'MB-2301-A',
      timeRequested: new Date(Date.now() - 2 * 60 * 60 * 1000),
      urgencyLevel: 'critical'
    },
    {
      id: '2',
      vessel: 'MV Ocean Voyager',
      part: 'Fuel Injection Pump',
      partNumber: 'FIP-4502-C',
      timeRequested: new Date(Date.now() - 5 * 60 * 60 * 1000),
      urgencyLevel: 'high'
    }
  ]);

  const [lowStockAlerts] = useState<LowStockAlert[]>([
    {
      id: '1',
      part: 'Oil Filter Element',
      partNumber: 'OF-1102-B',
      currentStock: 5,
      threshold: 10,
      affectedVessels: ['MV Sea Explorer', 'MV Ocean Voyager', 'MV Horizon']
    },
    {
      id: '2',
      part: 'Hydraulic Seal Kit',
      partNumber: 'HS-3401-D',
      currentStock: 2,
      threshold: 8,
      affectedVessels: ['MV Atlantic', 'MV Pacific']
    }
  ]);

  const [reorderRecommendations] = useState<ReorderRecommendation[]>([
    {
      id: '1',
      part: 'Air Filter Cartridge',
      partNumber: 'AF-2201-E',
      currentStock: 15,
      reorderPoint: 20,
      recommendedQuantity: 50,
      estimatedStockoutDays: 7
    },
    {
      id: '2',
      part: 'Cooling Water Treatment',
      partNumber: 'CWT-5501-A',
      currentStock: 8,
      reorderPoint: 10,
      recommendedQuantity: 30,
      estimatedStockoutDays: 10
    }
  ]);

  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'emergency',
      message: 'Critical: Main Engine Bearing requested by MV Sea Explorer - Immediate action required',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      urgency: 'critical'
    },
    {
      id: '2',
      type: 'reorder',
      message: 'Auto-reorder suggested: Oil Filter Elements running low across fleet',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      urgency: 'high'
    },
    {
      id: '3',
      type: 'availability',
      message: 'Critical part available: Fuel Injection Pump now in stock at Singapore warehouse',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      urgency: 'medium'
    }
  ]);

  const [partUsageTrends] = useState<PartUsageTrend[]>([
    { part: 'Oil Filters', trend: 'increasing', percentageChange: 25, forecastedDemand: 150 },
    { part: 'Fuel Filters', trend: 'stable', percentageChange: 2, forecastedDemand: 100 },
    { part: 'Air Filters', trend: 'decreasing', percentageChange: -10, forecastedDemand: 80 }
  ]);

  // Analytics Data
  const [revenueData] = useState<RevenueData[]>([
    { month: 'Jan', mrr: 45000, partsSales: 28000, total: 73000 },
    { month: 'Feb', mrr: 47000, partsSales: 32000, total: 79000 },
    { month: 'Mar', mrr: 46000, partsSales: 35000, total: 81000 },
    { month: 'Apr', mrr: 48000, partsSales: 31000, total: 79000 },
    { month: 'May', mrr: 51000, partsSales: 38000, total: 89000 },
    { month: 'Jun', mrr: 53000, partsSales: 42000, total: 95000 },
  ]);

  const [clientActivity] = useState<ClientActivity[]>([
    { company: 'Pacific Shipping', monday: 45, tuesday: 38, wednesday: 52, thursday: 41, friday: 35, saturday: 15, sunday: 8 },
    { company: 'Atlantic Maritime', monday: 32, tuesday: 28, wednesday: 35, thursday: 30, friday: 25, saturday: 12, sunday: 5 },
    { company: 'Global Fleet', monday: 28, tuesday: 25, wednesday: 30, thursday: 26, friday: 22, saturday: 10, sunday: 4 },
    { company: 'Ocean Carriers', monday: 25, tuesday: 22, wednesday: 28, thursday: 24, friday: 20, saturday: 8, sunday: 3 },
  ]);

  const [systemMetrics] = useState<SystemMetric[]>([
    { time: '00:00', responseTime: 120, uptime: 99.9, apiCalls: 150 },
    { time: '04:00', responseTime: 110, uptime: 100, apiCalls: 80 },
    { time: '08:00', responseTime: 180, uptime: 99.8, apiCalls: 320 },
    { time: '12:00', responseTime: 220, uptime: 99.9, apiCalls: 450 },
    { time: '16:00', responseTime: 200, uptime: 100, apiCalls: 380 },
    { time: '20:00', responseTime: 150, uptime: 99.9, apiCalls: 250 },
  ]);

  const [partSales] = useState<PartSale[]>([
    { name: 'Fuel Filters', revenue: 15000, quantity: 250, actualCost: 10000, margin: 33 },
    { name: 'Oil Filters', revenue: 12000, quantity: 200, actualCost: 8500, margin: 29 },
    { name: 'Air Filters', revenue: 8000, quantity: 150, actualCost: 5500, margin: 31 },
    { name: 'Hydraulic Seals', revenue: 18000, quantity: 100, actualCost: 12000, margin: 33 },
    { name: 'Bearings', revenue: 22000, quantity: 80, actualCost: 15000, margin: 32 },
  ]);

  const [userEngagement] = useState<UserEngagement[]>([
    { date: 'Mon', logins: 125, orders: 45, searches: 280 },
    { date: 'Tue', logins: 138, orders: 52, searches: 310 },
    { date: 'Wed', logins: 145, orders: 48, searches: 325 },
    { date: 'Thu', logins: 132, orders: 41, searches: 295 },
    { date: 'Fri', logins: 118, orders: 38, searches: 265 },
    { date: 'Sat', logins: 65, orders: 15, searches: 120 },
    { date: 'Sun', logins: 45, orders: 8, searches: 85 },
  ]);

  const [vessels] = useState<Vessel[]>([
    { id: '1', name: 'MV Sea Explorer', company: 'Pacific Shipping', healthScore: 92, activeIssues: 2, lat: 1.3521, lng: 103.8198, status: 'operational' },
    { id: '2', name: 'MV Ocean Voyager', company: 'Atlantic Maritime', healthScore: 78, activeIssues: 5, lat: 22.3193, lng: 114.1694, status: 'maintenance' },
    { id: '3', name: 'MV Pacific Dream', company: 'Pacific Shipping', healthScore: 95, activeIssues: 0, lat: 35.6762, lng: 139.6503, status: 'operational' },
    { id: '4', name: 'MV Atlantic', company: 'Global Fleet', healthScore: 65, activeIssues: 8, lat: 40.7128, lng: -74.0060, status: 'critical' },
    { id: '5', name: 'MV Horizon', company: 'Ocean Carriers', healthScore: 88, activeIssues: 3, lat: 51.5074, lng: -0.1278, status: 'operational' },
  ]);

  const [forecastData] = useState<ForecastData[]>([
    { month: 'Jul', predicted: 98000, lower: 92000, upper: 104000 },
    { month: 'Aug', predicted: 102000, lower: 95000, upper: 109000 },
    { month: 'Sep', predicted: 105000, lower: 97000, upper: 113000 },
    { month: 'Oct', predicted: 108000, lower: 99000, upper: 117000 },
    { month: 'Nov', predicted: 112000, lower: 102000, upper: 122000 },
    { month: 'Dec', predicted: 115000, lower: 104000, upper: 126000 },
  ]);

  const [churnRisk] = useState<ChurnRisk[]>([
    { company: 'Small Cargo Ltd', riskScore: 85, lastActivity: 45, orderFrequency: 0.5 },
    { company: 'Island Ferries', riskScore: 72, lastActivity: 30, orderFrequency: 1.2 },
    { company: 'Coastal Transport', riskScore: 68, lastActivity: 25, orderFrequency: 1.8 },
    { company: 'River Logistics', riskScore: 45, lastActivity: 15, orderFrequency: 3.2 },
  ]);

  const [supplierMetrics] = useState<SupplierMetric[]>([
    { supplier: 'Marine Parts Co.', onTimeDelivery: 95, qualityScore: 98, avgLeadTime: 3 },
    { supplier: 'Global Ship Supply', onTimeDelivery: 88, qualityScore: 92, avgLeadTime: 5 },
    { supplier: 'Ocean Tech Parts', onTimeDelivery: 92, qualityScore: 96, avgLeadTime: 4 }
  ]);

  // Procurement System State
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{
    name: string;
    partNumber: string;
    quantity: number;
    specs?: string;
  } | null>(null);
  
  const [suppliers] = useState<Supplier[]>([
    { id: '1', name: 'Marine Parts Co.', email: 'sales@marinepartsco.com', preferred: true },
    { id: '2', name: 'Global Ship Supply', email: 'quotes@globalshipsupply.com', preferred: true },
    { id: '3', name: 'Ocean Tech Parts', email: 'orders@oceantechparts.com', preferred: true },
    { id: '4', name: 'FastShip Solutions', email: 'procurement@fastship.com', preferred: false }
  ]);

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([
    {
      id: '1',
      partName: 'Fuel Filter Element',
      partNumber: 'FF-2234-B',
      quantity: 25,
      specs: 'OEM certified, 10 micron rating',
      requestedBy: 'MV Atlantic',
      dateRequested: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      quotes: [
        {
          id: 'q1',
          supplierId: '1',
          supplierName: 'Marine Parts Co.',
          partNumber: 'FF-2234-B',
          partName: 'Fuel Filter Element',
          quantity: 25,
          unitPrice: 45.00,
          totalPrice: 1125.00,
          leadTime: 3,
          dateReceived: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'received'
        },
        {
          id: 'q2',
          supplierId: '2',
          supplierName: 'Global Ship Supply',
          partNumber: 'FF-2234-B',
          partName: 'Fuel Filter Element',
          quantity: 25,
          unitPrice: 52.00,
          totalPrice: 1300.00,
          leadTime: 5,
          dateReceived: new Date(Date.now() - 20 * 60 * 60 * 1000),
          status: 'received'
        }
      ],
      status: 'quotes_received'
    }
  ]);

  const getTimeSince = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-500';
      case 'decreasing': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Procurement System Functions
  const openProcurementModal = (part: { name: string; partNumber: string; quantity: number; specs?: string }) => {
    setSelectedPart(part);
    setSelectedSuppliers(suppliers.filter(s => s.preferred).map(s => s.id));
    setShowProcurementModal(true);
  };

  const handleRequestQuotes = () => {
    if (!selectedPart || selectedSuppliers.length === 0) return;

    const newRequest: ProcurementRequest = {
      id: Date.now().toString(),
      partName: selectedPart.name,
      partNumber: selectedPart.partNumber,
      quantity: selectedPart.quantity,
      specs: selectedPart.specs || '',
      requestedBy: 'System',
      dateRequested: new Date(),
      quotes: [],
      status: 'quote_requested'
    };

    setProcurementRequests([...procurementRequests, newRequest]);
    setShowProcurementModal(false);
    setSelectedPart(null);
    setSelectedSuppliers([]);
  };

  const calculateClientPrice = (supplierPrice: number): number => {
    // Apply 20% markup (hidden from UI)
    return supplierPrice * 1.20;
  };

  const handleSendToClient = (requestId: string, quoteId: string) => {
    setProcurementRequests(prevRequests =>
      prevRequests.map(req => {
        if (req.id === requestId) {
          const selectedQuote = req.quotes.find(q => q.id === quoteId);
          if (selectedQuote) {
            return {
              ...req,
              clientPrice: calculateClientPrice(selectedQuote.totalPrice),
              status: 'sent_to_client' as const,
              quotes: req.quotes.map(q =>
                q.id === quoteId ? { ...q, status: 'sent_to_client' as const } : q
              )
            };
          }
        }
        return req;
      })
    );
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getProcurementStatusCounts = () => {
    const counts = {
      pendingQuotes: 0,
      quotesReceived: 0,
      sentToClient: 0,
      orderConfirmed: 0
    };

    procurementRequests.forEach(req => {
      switch (req.status) {
        case 'quote_requested':
          counts.pendingQuotes++;
          break;
        case 'quotes_received':
          counts.quotesReceived++;
          break;
        case 'sent_to_client':
          counts.sentToClient++;
          break;
        case 'order_confirmed':
          counts.orderConfirmed++;
          break;
      }
    });

    return counts;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">SMS Portal Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time inventory monitoring and alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FiSettings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <FiAlertTriangle className="w-6 h-6 text-red-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Critical Alerts</h2>
        </div>
        
        <div className="space-y-4">
          {/* Emergency Orders */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Emergency Orders</h3>
            <div className="space-y-2">
              {emergencyOrders.map(order => (
                <div key={order.id} className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full ${order.urgencyLevel === 'critical' ? 'bg-red-500' : 'bg-orange-500'} mt-2`} />
                    <div>
                      <p className="text-white font-medium">{order.vessel}</p>
                      <p className="text-gray-300 text-sm">{order.part} ({order.partNumber})</p>
                      <p className="text-gray-400 text-xs mt-1">{getTimeSince(order.timeRequested)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openProcurementModal({
                        name: order.part,
                        partNumber: order.partNumber,
                        quantity: 1,
                        specs: `Emergency order for ${order.vessel}`
                      })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <FiShoppingCart className="w-4 h-4 mr-1" />
                      Get Quotes
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Process Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-3">Low Stock Alerts</h3>
            <div className="space-y-2">
              {lowStockAlerts.map(alert => (
                <div key={alert.id} className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{alert.part} ({alert.partNumber})</p>
                      <p className="text-orange-400 text-sm">Stock: {alert.currentStock} / Threshold: {alert.threshold}</p>
                      <p className="text-gray-400 text-xs mt-1">Affects: {alert.affectedVessels.join(', ')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openProcurementModal({
                          name: alert.part,
                          partNumber: alert.partNumber,
                          quantity: alert.threshold * 2,
                          specs: `Low stock alert - Current: ${alert.currentStock}`
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                      >
                        <FiShoppingCart className="w-3 h-3 mr-1" />
                        Get Quotes
                      </button>
                      <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reorder Recommendations */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-3">Reorder Recommendations</h3>
            <div className="space-y-2">
              {reorderRecommendations.map(rec => (
                <div key={rec.id} className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{rec.part} ({rec.partNumber})</p>
                      <p className="text-yellow-400 text-sm">
                        Current: {rec.currentStock} | Reorder Point: {rec.reorderPoint} | Recommended Qty: {rec.recommendedQuantity}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">Estimated stockout in {rec.estimatedStockoutDays} days</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openProcurementModal({
                          name: rec.part,
                          partNumber: rec.partNumber,
                          quantity: rec.recommendedQuantity,
                          specs: `Reorder recommendation - Current stock: ${rec.currentStock}`
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                      >
                        <FiShoppingCart className="w-3 h-3 mr-1" />
                        Get Quotes
                      </button>
                      <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notifications Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <FiBell className="w-6 h-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Real-time Notifications</h2>
        </div>
        
        <div className="space-y-3">
          {notifications.map(notification => (
            <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${getUrgencyColor(notification.urgency)} mt-2`} />
              <div className="flex-1">
                <p className="text-white text-sm">{notification.message}</p>
                <p className="text-gray-400 text-xs mt-1">{getTimeSince(notification.timestamp)}</p>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <FiClock className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend />
              <Area type="monotone" dataKey="total" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
              <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="partsSales" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Current MRR</p>
              <p className="text-2xl font-bold text-green-500">$53,000</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Parts Revenue</p>
              <p className="text-2xl font-bold text-yellow-500">$42,000</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-500">$95,000</p>
            </div>
          </div>
        </div>

        {/* Client Activity Heatmap */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Client Activity Heatmap</h3>
          <div className="space-y-2">
            {clientActivity.map((client, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-white font-medium mb-2">{client.company}</p>
                <div className="grid grid-cols-7 gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dayIndex) => {
                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex];
                    const value = client[dayKey as keyof ClientActivity] as number;
                    const opacity = value / 60;
                    return (
                      <div key={dayIndex} className="text-center">
                        <p className="text-xs text-gray-400 mb-1">{day}</p>
                        <div 
                          className="w-full h-8 rounded flex items-center justify-center text-xs font-medium"
                          style={{ 
                            backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                            color: opacity > 0.5 ? 'white' : '#9ca3af'
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Performance and Part Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={systemMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="responseTime" fill="#f59e0b" name="Response Time (ms)" />
              <Line yAxisId="right" type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Avg Response</p>
              <p className="text-xl font-bold text-yellow-500">165ms</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Uptime</p>
              <p className="text-xl font-bold text-green-500">99.9%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total API Calls</p>
              <p className="text-xl font-bold text-blue-500">1,480</p>
            </div>
          </div>
        </div>

        {/* Part Sales Analytics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Top Selling Parts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partSales} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  return [value, name];
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-400">
            <p>Total Parts Revenue: <span className="text-white font-bold">$75,000</span></p>
            <p className="mt-1">Average Margin: <span className="text-green-500 font-bold">31.6%</span></p>
          </div>
        </div>
      </div>

      {/* User Engagement and Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement Trends */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">User Engagement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userEngagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend />
              <Area type="monotone" dataKey="searches" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="orders" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="logins" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Overview */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Fleet Health Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {vessels.map((vessel) => (
              <div 
                key={vessel.id} 
                className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FiAnchor className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium text-sm">{vessel.name}</p>
                      <p className="text-gray-400 text-xs">{vessel.company}</p>
                    </div>
                  </div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getHealthScoreColor(vessel.healthScore) }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Health</p>
                    <p className="text-white font-medium">{vessel.healthScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Issues</p>
                    <p className={`font-medium ${vessel.activeIssues > 5 ? 'text-red-500' : vessel.activeIssues > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {vessel.activeIssues}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-700/50 rounded p-2">
              <p className="text-gray-400 text-xs">Operational</p>
              <p className="text-green-500 font-bold">3</p>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <p className="text-gray-400 text-xs">Maintenance</p>
              <p className="text-yellow-500 font-bold">1</p>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <p className="text-gray-400 text-xs">Critical</p>
              <p className="text-red-500 font-bold">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Predictive Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Forecasting */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Revenue Forecast</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="#3b82f6" fillOpacity={0.2} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" fillOpacity={0.2} />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">6-Month Forecast</p>
              <p className="text-2xl font-bold text-blue-500">$115,000</p>
              <p className="text-green-500 text-sm">+21% growth</p>
            </div>
          </div>

          {/* Client Churn Risk */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Client Churn Risk</h3>
            <div className="space-y-2">
              {churnRisk.map((client, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white font-medium text-sm">{client.company}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      client.riskScore > 70 ? 'bg-red-500/20 text-red-500' : 
                      client.riskScore > 50 ? 'bg-yellow-500/20 text-yellow-500' : 
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {client.riskScore}% risk
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Last Active</p>
                      <p className="text-gray-300">{client.lastActivity}d ago</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Order Freq</p>
                      <p className="text-gray-300">{client.orderFrequency}/mo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Capacity Planning */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">System Capacity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={[
                { name: 'API Calls', value: 68, fill: '#3b82f6' },
                { name: 'Storage', value: 45, fill: '#10b981' },
                { name: 'Bandwidth', value: 82, fill: '#f59e0b' },
                { name: 'CPU', value: 55, fill: '#8b5cf6' },
              ]}>
                <RadialBar dataKey="value" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-400">API: 68%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-400">Storage: 45%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-400">Bandwidth: 82%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-400">CPU: 55%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Intelligence Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <FiTrendingUp className="w-6 h-6 text-green-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Inventory Intelligence</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parts Usage Trends */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Parts Usage Trends</h3>
            <div className="space-y-3">
              {partUsageTrends.map((trend, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{trend.part}</p>
                      <p className="text-gray-400 text-sm">Forecasted demand: {trend.forecastedDemand} units</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getTrendColor(trend.trend)}`}>
                        {getTrendIcon(trend.trend)} {Math.abs(trend.percentageChange)}%
                      </span>
                      <p className="text-gray-400 text-xs">{trend.trend}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Stock-out Warnings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Predictive Stock-out Warnings</h3>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Critical Parts at Risk</span>
                  <span className="text-red-500 font-bold">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Parts Needing Reorder (7 days)</span>
                  <span className="text-orange-500 font-bold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Parts Well-Stocked</span>
                  <span className="text-green-500 font-bold">43</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
                View Detailed Analysis
              </button>
            </div>
          </div>

          {/* Supplier Performance Metrics */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Supplier Performance</h3>
            <div className="space-y-3">
              {supplierMetrics.map((supplier, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">{supplier.supplier}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">On-Time</p>
                      <p className="text-white font-medium">{supplier.onTimeDelivery}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quality</p>
                      <p className="text-white font-medium">{supplier.qualityScore}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Lead Time</p>
                      <p className="text-white font-medium">{supplier.avgLeadTime} days</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Optimization Suggestions */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Cost Optimization</h3>
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Bulk Order Opportunity</p>
                  <p className="text-gray-400 text-xs">Save 15% by combining orders for Oil Filters across fleet</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiInfo className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Alternative Supplier Available</p>
                  <p className="text-gray-400 text-xs">20% cost reduction possible for Hydraulic Seals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Overstock Alert</p>
                  <p className="text-gray-400 text-xs">Reduce Air Filter inventory by 30% to optimize storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Feedback Management Quick Access */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiMessageSquare className="w-6 h-6 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">User Feedback</h2>
            </div>
            <button
              onClick={() => navigate('/feedback')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              View All Feedback
            </button>
          </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">New Feedback</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-2xl font-bold text-white">12</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Bug Reports</span>
              <span className="text-red-500 text-xs">🐛</span>
            </div>
            <p className="text-2xl font-bold text-white">3</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Feature Requests</span>
              <span className="text-green-500 text-xs">✨</span>
            </div>
            <p className="text-2xl font-bold text-white">7</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Resolved</span>
              <FiCheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">45</p>
          </div>
        </div>
        
        {/* Activation Code Management Quick Access */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiKey className="w-6 h-6 text-purple-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">Activation Codes</h2>
            </div>
            <button
              onClick={() => navigate('/admin/activation-codes')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Manage Codes
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Active Codes</span>
                <FiClock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">8</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Activated</span>
                <FiCheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">142</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Expired</span>
                <FiAlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-white">23</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Success Rate</span>
                <FiTrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">86%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement Status Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <FiFileText className="w-6 h-6 text-purple-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Procurement Status</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pending Quotes</span>
              <FiClock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-white">{getProcurementStatusCounts().pendingQuotes}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Quotes Received</span>
              <FiFileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{getProcurementStatusCounts().quotesReceived}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Sent to Client</span>
              <FiSend className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">{getProcurementStatusCounts().sentToClient}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Order Confirmed</span>
              <FiCheckSquare className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-white">{getProcurementStatusCounts().orderConfirmed}</p>
          </div>
        </div>

        {/* Recent Procurement Requests */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Recent Procurement Activity</h3>
          <div className="space-y-3">
            {procurementRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{request.partName} ({request.partNumber})</p>
                    <p className="text-gray-400 text-sm">Quantity: {request.quantity} | {getTimeSince(request.dateRequested)}</p>
                    <p className="text-sm mt-1">
                      <span className="text-gray-400">Status: </span>
                      <span className={`font-medium ${
                        request.status === 'quote_requested' ? 'text-yellow-500' :
                        request.status === 'quotes_received' ? 'text-blue-500' :
                        request.status === 'sent_to_client' ? 'text-green-500' :
                        'text-purple-500'
                      }`}>
                        {request.status.replace(/_/g, ' ').charAt(0).toUpperCase() + request.status.replace(/_/g, ' ').slice(1)}
                      </span>
                    </p>
                  </div>
                  {request.status === 'quotes_received' && request.quotes.length > 0 && (
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">Best Quote</p>
                      <p className="text-white font-bold">${Math.min(...request.quotes.map(q => q.totalPrice)).toFixed(2)}</p>
                      <p className="text-gray-400 text-xs">{request.quotes.length} quotes received</p>
                    </div>
                  )}
                </div>
                {request.status === 'quotes_received' && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex flex-wrap gap-2">
                      {request.quotes.map((quote) => (
                        <div key={quote.id} className="flex items-center space-x-2">
                          <span className="text-gray-300 text-sm">{quote.supplierName}:</span>
                          <span className="text-white font-medium">${quote.totalPrice.toFixed(2)}</span>
                          <button
                            onClick={() => handleSendToClient(request.id, quote.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Send to Client
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procurement Modal */}
      {showProcurementModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Request Quotes</h2>
              <button
                onClick={() => setShowProcurementModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Part Details */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Part Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Part Name</p>
                  <p className="text-white font-medium">{selectedPart.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Part Number</p>
                  <p className="text-white font-medium">{selectedPart.partNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Quantity Needed</p>
                  <p className="text-white font-medium">{selectedPart.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Specifications</p>
                  <p className="text-white font-medium">{selectedPart.specs || 'Standard'}</p>
                </div>
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Select Suppliers</h3>
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <label key={supplier.id} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                        } else {
                          setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{supplier.name}</p>
                      <p className="text-gray-400 text-sm">{supplier.email}</p>
                    </div>
                    {supplier.preferred && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Preferred</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowProcurementModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestQuotes}
                disabled={selectedSuppliers.length === 0}
                className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  selectedSuppliers.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <FiSend className="w-4 h-4 mr-2" />
                Request Quotes ({selectedSuppliers.length} suppliers)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalPortal;