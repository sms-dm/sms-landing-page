import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiAlertCircle, 
  FiShoppingCart, 
  FiCalendar,
  FiSearch,
  FiFilter,
  FiPlus,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiFileText,
  FiBell,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  location: string;
  unitCost: number;
  supplier: string;
  leadTimeDays: number;
  lastRestockDate: string;
  equipment?: string[];
}

interface Order {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDelivery: string;
  status: 'Ordered' | 'Shipped' | 'Delivered';
  supplier: string;
  items: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    unitCost: number;
  }>;
  totalCost: number;
  trackingNumber?: string;
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sample parts data with equipment-specific parts
  const parts: Part[] = [
    // HPU Parts
    { id: '1', partNumber: 'CR-2745', name: 'Control Relay 24VDC', category: 'Electrical', currentStock: 3, reorderLevel: 5, maxStock: 15, location: 'E-Store Cab 3', unitCost: 125, supplier: 'ElectroSupply Co', leadTimeDays: 7, lastRestockDate: '2024-11-15', equipment: ['HPU 1 Starter Panel', 'HPU 2 Starter Panel'] },
    { id: '2', partNumber: 'MC-450A', name: 'Main Contactor 450A', category: 'Electrical', currentStock: 1, reorderLevel: 3, maxStock: 8, location: 'E-Store Cab 5', unitCost: 850, supplier: 'ElectroSupply Co', leadTimeDays: 14, lastRestockDate: '2024-10-20', equipment: ['HPU 1 Starter Panel', 'HPU 2 Starter Panel'] },
    { id: '3', partNumber: 'OL-350', name: 'Overload Relay', category: 'Electrical', currentStock: 2, reorderLevel: 4, maxStock: 10, location: 'E-Store Cab 3', unitCost: 275, supplier: 'ElectroSupply Co', leadTimeDays: 10, lastRestockDate: '2024-11-01', equipment: ['HPU 1 Motor', 'HPU 2 Motor'] },
    { id: '4', partNumber: 'BRG-6205', name: 'Motor Bearing 6205', category: 'Mechanical', currentStock: 4, reorderLevel: 6, maxStock: 20, location: 'Mech Store', unitCost: 45, supplier: 'BearingWorld', leadTimeDays: 5, lastRestockDate: '2024-11-10', equipment: ['HPU 1 Motor', 'HPU 2 Motor', 'Mud Pump 1', 'Mud Pump 2'] },
    
    // Mud System Parts
    { id: '5', partNumber: 'VS-3000', name: 'Valve Seal 3"', category: 'Hydraulic', currentStock: 12, reorderLevel: 10, maxStock: 30, location: 'Hyd Store A2', unitCost: 25, supplier: 'HydraulicParts Inc', leadTimeDays: 7, lastRestockDate: '2024-11-20', equipment: ['Mud Pump 1', 'Mud Pump 2'] },
    { id: '6', partNumber: 'PS-5000', name: 'Pressure Sensor 5000psi', category: 'Instrumentation', currentStock: 0, reorderLevel: 2, maxStock: 6, location: 'Inst Store', unitCost: 1250, supplier: 'SensorTech', leadTimeDays: 21, lastRestockDate: '2024-09-15', equipment: ['Mud Pump 1', 'Mud Pump 2', 'BOP Control Panel'] },
    { id: '7', partNumber: 'SS-SCREEN-20', name: 'Shaker Screen 20 Mesh', category: 'Consumable', currentStock: 24, reorderLevel: 20, maxStock: 50, location: 'Mud Pit Store', unitCost: 185, supplier: 'DrillingSupplies Ltd', leadTimeDays: 14, lastRestockDate: '2024-11-05', equipment: ['Shale Shaker 1'] },
    
    // Generator Parts
    { id: '8', partNumber: 'AF-CAT-3516', name: 'Air Filter CAT3516', category: 'Consumable', currentStock: 8, reorderLevel: 6, maxStock: 18, location: 'Gen Store', unitCost: 125, supplier: 'Caterpillar', leadTimeDays: 10, lastRestockDate: '2024-11-12', equipment: ['Generator 1', 'Generator 2', 'Generator 3'] },
    { id: '9', partNumber: 'AVR-3516', name: 'AVR Module CAT3516', category: 'Electrical', currentStock: 1, reorderLevel: 2, maxStock: 4, location: 'Gen Store', unitCost: 3500, supplier: 'Caterpillar', leadTimeDays: 30, lastRestockDate: '2024-08-20', equipment: ['Generator 1', 'Generator 2', 'Generator 3'] },
    
    // Control System Parts
    { id: '10', partNumber: 'FS-30A', name: 'Control Fuse 30A', category: 'Electrical', currentStock: 12, reorderLevel: 20, maxStock: 50, location: 'E-Store Cab 1', unitCost: 8, supplier: 'ElectroSupply Co', leadTimeDays: 3, lastRestockDate: '2024-11-18', equipment: ['Driller Console', 'SCR Control Panel'] },
    { id: '11', partNumber: 'CPU-DC5000', name: 'CPU Module DC-5000', category: 'Control System', currentStock: 0, reorderLevel: 1, maxStock: 2, location: 'Control Room Store', unitCost: 8500, supplier: 'DrillControl Systems', leadTimeDays: 45, lastRestockDate: '2024-07-10', equipment: ['Driller Console'] },
    
    // Thruster Parts
    { id: '12', partNumber: 'HS-3000', name: 'Hydraulic Seal Kit', category: 'Hydraulic', currentStock: 3, reorderLevel: 4, maxStock: 12, location: 'Hyd Store B1', unitCost: 450, supplier: 'MarineHydraulics', leadTimeDays: 14, lastRestockDate: '2024-10-25', equipment: ['Bow Thruster 1', 'Bow Thruster 2', 'Stern Thruster 1', 'Stern Thruster 2'] },
    { id: '13', partNumber: 'PROP-BT3000', name: 'Propeller Blade Set', category: 'Mechanical', currentStock: 1, reorderLevel: 1, maxStock: 2, location: 'Main Store', unitCost: 45000, supplier: 'ThrusterTech Marine', leadTimeDays: 90, lastRestockDate: '2024-06-01', equipment: ['Bow Thruster 1', 'Bow Thruster 2'] },
  ];

  // Sample orders data
  const orders: Order[] = [
    {
      id: '1',
      poNumber: 'PO-2024-0892',
      orderDate: '2024-11-25',
      expectedDelivery: '2024-12-05',
      status: 'Shipped',
      supplier: 'SensorTech',
      items: [
        { partNumber: 'PS-5000', partName: 'Pressure Sensor 5000psi', quantity: 4, unitCost: 1250 }
      ],
      totalCost: 5000,
      trackingNumber: 'ST-789456123'
    },
    {
      id: '2',
      poNumber: 'PO-2024-0891',
      orderDate: '2024-11-24',
      expectedDelivery: '2024-12-15',
      status: 'Ordered',
      supplier: 'DrillControl Systems',
      items: [
        { partNumber: 'CPU-DC5000', partName: 'CPU Module DC-5000', quantity: 1, unitCost: 8500 }
      ],
      totalCost: 8500,
    },
    {
      id: '3',
      poNumber: 'PO-2024-0890',
      orderDate: '2024-11-22',
      expectedDelivery: '2024-11-29',
      status: 'Delivered',
      supplier: 'ElectroSupply Co',
      items: [
        { partNumber: 'CR-2745', partName: 'Control Relay 24VDC', quantity: 10, unitCost: 125 },
        { partNumber: 'FS-30A', partName: 'Control Fuse 30A', quantity: 30, unitCost: 8 }
      ],
      totalCost: 1490,
    }
  ];

  // Categories
  const categories = ['all', 'Electrical', 'Mechanical', 'Hydraulic', 'Instrumentation', 'Consumable', 'Control System'];

  // Filter parts
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalParts = parts.reduce((sum, part) => sum + part.currentStock, 0);
    const lowStockParts = parts.filter(part => part.currentStock <= part.reorderLevel);
    const outOfStockParts = parts.filter(part => part.currentStock === 0);
    const pendingOrders = orders.filter(order => order.status !== 'Delivered');
    const lastRestockDate = parts.reduce((latest, part) => {
      return new Date(part.lastRestockDate) > new Date(latest) ? part.lastRestockDate : latest;
    }, parts[0]?.lastRestockDate || '');

    return {
      totalParts,
      lowStockCount: lowStockParts.length,
      outOfStockCount: outOfStockParts.length,
      pendingOrdersCount: pendingOrders.length,
      lastRestockDate,
      totalInventoryValue: parts.reduce((sum, part) => sum + (part.currentStock * part.unitCost), 0)
    };
  }, [parts, orders]);

  // Get stock level color
  const getStockColor = (current: number, reorder: number) => {
    if (current === 0) return 'text-red-400 bg-red-900/30';
    if (current <= reorder) return 'text-amber-400 bg-amber-900/30';
    return 'text-green-400 bg-green-900/30';
  };

  // Get order status color
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Ordered': return 'text-blue-400 bg-blue-900/30';
      case 'Shipped': return 'text-amber-400 bg-amber-900/30';
      case 'Delivered': return 'text-green-400 bg-green-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const handleQuickOrder = (part: Part) => {
    setSelectedPart(part);
    showSuccess(`Quick order initiated for ${part.name}`);
    // In a real app, this would open an order form or navigate to order page
  };

  const handleEmergencyOrder = () => {
    setShowEmergencyForm(true);
  };

  const handleViewHistory = () => {
    showInfo('Stock history feature coming soon');
  };

  const handleGenerateReport = () => {
    showSuccess('Generating inventory report...');
    // In a real app, this would generate and download a PDF report
  };

  const handleSetAlerts = () => {
    showInfo('Reorder alerts configuration coming soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiPackage className="w-6 h-6 text-sms-cyan" />
                <h1 className="text-xl font-bold text-white">Inventory Management</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Stock Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiPackage className="w-8 h-8 text-sms-cyan" />
              <span className="text-2xl font-bold text-white">{stats.totalParts}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Total Parts in Stock</h3>
            <p className="text-xs text-gray-500 mt-1">Value: ${stats.totalInventoryValue.toLocaleString()}</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold text-white">{stats.lowStockCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Low Stock Alerts</h3>
            <p className="text-xs text-red-400 mt-1">{stats.outOfStockCount} out of stock</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiShoppingCart className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.pendingOrdersCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Pending Orders</h3>
            <p className="text-xs text-gray-500 mt-1">{orders.length} total orders</p>
          </div>

          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <FiCalendar className="w-8 h-8 text-green-400" />
              <span className="text-sm font-semibold text-white">
                {new Date(stats.lastRestockDate).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">Last Restock</h3>
            <p className="text-xs text-gray-500 mt-1">Multiple deliveries</p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleEmergencyOrder}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 rounded-lg transition-all duration-300"
            >
              <FiAlertTriangle className="w-4 h-4" />
              <span>Emergency Order</span>
            </button>
            <button
              onClick={handleViewHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all duration-300"
            >
              <FiClock className="w-4 h-4" />
              <span>Stock History</span>
            </button>
            <button
              onClick={handleGenerateReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-400 rounded-lg transition-all duration-300"
            >
              <FiFileText className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={handleSetAlerts}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-all duration-300"
            >
              <FiBell className="w-4 h-4" />
              <span>Set Alerts</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search parts by name, number, or location..."
                className="w-full pl-10 pr-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Parts Inventory</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 text-sm font-semibold text-gray-400">Part Number</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Name</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Category</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Stock</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Reorder Level</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Location</th>
                  <th className="pb-3 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-800 hover:bg-sms-gray/50 transition-colors">
                    <td className="py-4 text-sm text-white font-medium">{part.partNumber}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm text-white">{part.name}</p>
                        {part.equipment && part.equipment.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Used in: {part.equipment.slice(0, 2).join(', ')}
                            {part.equipment.length > 2 && ` +${part.equipment.length - 2} more`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-400">{part.category}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStockColor(part.currentStock, part.reorderLevel)}`}>
                        {part.currentStock}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-400">{part.reorderLevel}</td>
                    <td className="py-4 text-sm text-gray-400">{part.location}</td>
                    <td className="py-4">
                      {part.currentStock <= part.reorderLevel && (
                        <button
                          onClick={() => handleQuickOrder(part)}
                          className="flex items-center space-x-1 px-3 py-1 bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-400 rounded-lg transition-all duration-300 text-sm"
                        >
                          <FiPlus className="w-4 h-4" />
                          <span>Order</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Orders Section */}
        <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Active Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-sms-gray/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{order.poNumber}</h3>
                    <p className="text-xs text-gray-400 mt-1">Supplier: {order.supplier}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
                    {order.status === 'Shipped' && <FiTruck className="inline w-3 h-3 mr-1" />}
                    {order.status === 'Delivered' && <FiCheckCircle className="inline w-3 h-3 mr-1" />}
                    {order.status === 'Ordered' && <FiClock className="inline w-3 h-3 mr-1" />}
                    {order.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="text-sm text-gray-300">{new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expected Delivery</p>
                    <p className="text-sm text-gray-300">{new Date(order.expectedDelivery).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm text-gray-300 font-semibold">${order.totalCost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-500 mb-2">Items:</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.partName} (x{item.quantity})</span>
                      <span className="text-gray-400">${(item.quantity * item.unitCost).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">Tracking: <span className="text-blue-400">{order.trackingNumber}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Order Modal */}
      {showEmergencyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Emergency Order Request</h3>
            <p className="text-sm text-gray-400 mb-4">
              Emergency orders are expedited with priority shipping. Use only for critical situations.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEmergencyForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Emergency order form opened');
                  setShowEmergencyForm(false);
                  navigate('/emergency-order');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;