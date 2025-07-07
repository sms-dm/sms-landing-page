import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiPackage, FiClipboard, FiClock, FiUser, FiFileText, FiChevronRight, FiLink, FiBook, FiFilter, FiTool, FiShield, FiMessageSquare, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FaultReport {
  id: string;
  timestamp: string;
  equipment: string;
  equipmentId: string;
  location: string;
  faultType: 'critical' | 'minor';
  description: string;
  status: 'resolved' | 'pending';
  downtime?: string;
}

interface PartUsage {
  partNo: string;
  name: string;
  quantityUsed: number;
  currentStock: number;
  category: string;
}

interface LowStockPart {
  partNo: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  category: string;
}

interface HandoverNote {
  id: string;
  content: string;
  timestamp: string;
}

interface DailyLogEntry {
  id: string;
  date: string;
  category: 'equipment' | 'maintenance' | 'safety' | 'general';
  title: string;
  description: string;
  importantForHandover: boolean;
  timestamp: string;
}

const HandoverComplete: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [shiftDuration, setShiftDuration] = useState('');
  const [shiftSummary, setShiftSummary] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  // Data state
  const [faultReports, setFaultReports] = useState<FaultReport[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsage[]>([]);
  const [lowStockParts, setLowStockParts] = useState<LowStockPart[]>([]);
  const [rotation, setRotation] = useState<any>(null);
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>([]);
  const [dailyLogEntries, setDailyLogEntries] = useState<DailyLogEntry[]>([]);
  const [selectedLogCategory, setSelectedLogCategory] = useState<string>('all');
  
  // Auto-populated fields
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const vesselName = 'MV Pacific Explorer';
  
  // Mock technicians for handover
  const availableTechnicians = [
    { id: '1', name: 'Sarah Williams', role: 'Lead Electrician', vessel: 'MV Pacific Explorer' },
    { id: '2', name: 'Mike Chen', role: 'Senior Electrician', vessel: 'MV Pacific Explorer' },
    { id: '3', name: 'Tom Rodriguez', role: 'Drilling Electrician', vessel: 'MV Pacific Explorer' },
    { id: '4', name: 'James Parker', role: 'Electrician', vessel: 'MV Pacific Explorer' },
    { id: '5', name: 'David Liu', role: 'Junior Electrician', vessel: 'MV Pacific Explorer' }
  ].filter(tech => tech.name !== `${user?.firstName} ${user?.lastName}`);
  
  useEffect(() => {
    // Load rotation data
    const rotationData = localStorage.getItem('sms_rotation');
    if (rotationData) {
      setRotation(JSON.parse(rotationData));
    }
    
    // Load fault reports from session
    const reports = JSON.parse(sessionStorage.getItem('fault_reports') || '[]');
    const swingReports = reports.map((report: any, index: number) => ({
      id: `FR-${new Date(report.timestamp).getTime()}-${index}`,
      timestamp: report.timestamp,
      equipment: report.equipment,
      equipmentId: report.equipmentId,
      location: report.location,
      faultType: report.faultType,
      description: report.description,
      status: 'resolved' as const,
      downtime: report.downtime
    }));
    setFaultReports(swingReports);
    
    // Calculate parts used (mock data for demo)
    const partsData: PartUsage[] = [
      { partNo: 'CR-2745', name: 'Control Relay 24VDC', quantityUsed: 3, currentStock: 3, category: 'Control' },
      { partNo: 'BRG-6205', name: 'Motor Bearing 6205', quantityUsed: 2, currentStock: 2, category: 'Mechanical' },
      { partNo: 'FS-30A', name: 'Control Fuse 30A', quantityUsed: 5, currentStock: 7, category: 'Protection' },
      { partNo: 'IND-24V-R', name: 'Red Indicator Light 24V', quantityUsed: 1, currentStock: 7, category: 'Indication' },
      { partNo: 'SEAL-V45', name: 'Shaft Seal V-Ring 45mm', quantityUsed: 1, currentStock: 5, category: 'Sealing' }
    ];
    setPartsUsed(partsData);
    
    // Calculate low stock parts
    const lowStock: LowStockPart[] = [
      { partNo: 'MC-450A', name: 'Main Contactor 450A', currentStock: 1, reorderLevel: 3, category: 'Power' },
      { partNo: 'BRG-6305', name: 'Motor Bearing 6305', currentStock: 2, reorderLevel: 4, category: 'Mechanical' },
      { partNo: 'BRG-CRANK', name: 'Crankshaft Bearing', currentStock: 1, reorderLevel: 2, category: 'Mechanical' },
      { partNo: 'CB-50A', name: 'Circuit Breaker 50A', currentStock: 2, reorderLevel: 3, category: 'Power' }
    ];
    setLowStockParts(lowStock);
    
    // Load handover notes from localStorage
    const savedNotes = localStorage.getItem('sms_handover_notes');
    if (savedNotes) {
      setHandoverNotes(JSON.parse(savedNotes));
    }
    
    // Load daily log entries from localStorage
    const savedLogEntries = localStorage.getItem('sms_daily_log_entries');
    if (savedLogEntries) {
      const entries = JSON.parse(savedLogEntries);
      // Sort entries by date and timestamp (newest first)
      entries.sort((a: DailyLogEntry, b: DailyLogEntry) => {
        const dateA = new Date(`${a.date}T${a.timestamp}`);
        const dateB = new Date(`${b.date}T${b.timestamp}`);
        return dateB.getTime() - dateA.getTime();
      });
      setDailyLogEntries(entries);
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTechnician || !shiftDuration || !shiftSummary) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare handover data
      const handoverData = {
        outgoingTechnician: {
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          role: 'Drilling Electrician'
        },
        incomingTechnician: availableTechnicians.find(t => t.id === selectedTechnician),
        vessel: vesselName,
        date: new Date().toISOString(),
        shiftDuration,
        shiftSummary,
        specialNotes,
        recommendations,
        faultReports: faultReports.map(report => ({
          ...report,
          link: `/fault/view/${report.id}`
        })),
        partsUsed,
        lowStockParts,
        dailyLogEntries: dailyLogEntries.filter(entry => entry.importantForHandover),
        rotationId: rotation?.id
      };
      
      // Store handover data (in production, this would be an API call)
      const handovers = JSON.parse(localStorage.getItem('sms_handovers') || '[]');
      handovers.push(handoverData);
      localStorage.setItem('sms_handovers', JSON.stringify(handovers));
      
      // Mark handover as completed
      localStorage.setItem('sms_handover_completed', 'true');
      
      // Show success messages
      toast.success('Handover report submitted successfully!', { duration: 3000 });
      
      setTimeout(() => {
        toast.success('✓ Incoming technician notified', { duration: 3000 });
      }, 500);
      
      if (lowStockParts.length > 0) {
        setTimeout(() => {
          toast('📦 Low stock alert sent to procurement', {
            duration: 4000,
            style: {
              background: '#ea580c',
              color: '#fff',
            }
          });
        }, 1000);
      }
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard/technician');
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to submit handover report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFaultClick = (faultId: string) => {
    // Navigate to fault details (would be implemented in full app)
    toast('Opening fault report details...', { icon: '📋' });
  };
  
  const handleImportDailyLogs = () => {
    try {
      // Load all daily log entries from localStorage
      const savedLogEntries = localStorage.getItem('sms_daily_log_entries');
      if (!savedLogEntries) {
        toast.error('No daily log entries found');
        return;
      }
      
      const entries: DailyLogEntry[] = JSON.parse(savedLogEntries);
      
      // Sort entries by date and time (chronological order)
      entries.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.timestamp}`);
        const dateB = new Date(`${b.date}T${b.timestamp}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Group entries by date
      const entriesByDate = entries.reduce((acc, entry) => {
        if (!acc[entry.date]) {
          acc[entry.date] = [];
        }
        acc[entry.date].push(entry);
        return acc;
      }, {} as Record<string, DailyLogEntry[]>);
      
      // Format the entries
      let formattedLogs = '';
      
      Object.keys(entriesByDate)
        .sort() // Sort dates chronologically
        .forEach((date, index) => {
          if (index > 0) {
            formattedLogs += '\n'; // Blank line between days
          }
          
          // Add date header
          const dateObj = new Date(date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          formattedLogs += `=== ${formattedDate} ===\n\n`;
          
          // Add entries for this date
          entriesByDate[date].forEach((entry, entryIndex) => {
            if (entryIndex > 0) {
              formattedLogs += '\n';
            }
            
            // Format category
            const categoryLabel = entry.category.charAt(0).toUpperCase() + entry.category.slice(1).replace('_', ' ');
            
            // Add star for important entries
            if (entry.importantForHandover) {
              formattedLogs += '⭐ ';
            }
            
            // Add entry details
            formattedLogs += `[${categoryLabel}] ${entry.title}\n`;
            formattedLogs += `Time: ${entry.timestamp}\n`;
            formattedLogs += `${entry.description}\n`;
          });
        });
      
      // Set the formatted logs in the shift summary
      setShiftSummary(formattedLogs);
      
      toast.success(`Imported ${entries.length} daily log entries`, {
        duration: 3000,
        icon: '📋'
      });
      
    } catch (error) {
      console.error('Error importing daily logs:', error);
      toast.error('Failed to import daily logs');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-blue-900/20 border-b border-blue-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiClipboard className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Handover Completion Form</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Rotation End: {rotation?.endDate ? new Date(rotation.endDate).toLocaleDateString() : 'N/A'}</span>
              <span>•</span>
              <span>{currentDate} {currentTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form */}
      <div className="max-w-6xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Handover Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Technician</label>
                <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Drilling Electrician</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time</label>
                <p className="text-white">{currentDate}</p>
                <p className="text-xs text-gray-500">{currentTime}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vessel</label>
                <p className="text-white">{vesselName}</p>
                <p className="text-xs text-gray-500">Drilling Vessel</p>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Incoming Technician <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="">Select technician...</option>
                  {availableTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} - {tech.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Shift Duration <span className="text-red-400">*</span>
                </label>
                <select
                  value={shiftDuration}
                  onChange={(e) => setShiftDuration(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                >
                  <option value="">Select duration...</option>
                  <option value="12hr">12 Hour Shift</option>
                  <option value="24hr">24 Hour Shift</option>
                  <option value="14days">14 Day Rotation</option>
                  <option value="28days">28 Day Rotation</option>
                  <option value="42days">42 Day Rotation</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Fault Reports Section */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FiFileText className="w-5 h-5 text-purple-400" />
                <span>Fault Reports from Current Swing</span>
                <span className="text-sm text-gray-400">({faultReports.length} total)</span>
              </h2>
            </div>
            
            {faultReports.length > 0 ? (
              <div className="space-y-3">
                {faultReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleFaultClick(report.id)}
                    className="bg-sms-gray/40 border border-gray-700 rounded-lg p-4 hover:border-gray-600 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {report.faultType === 'critical' ? (
                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <FiAlertTriangle className="w-5 h-5 text-amber-500" />
                          )}
                          <h3 className="font-semibold text-white">{report.equipment}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.faultType === 'critical' 
                              ? 'bg-red-900/30 text-red-400' 
                              : 'bg-amber-900/30 text-amber-400'
                          }`}>
                            {report.faultType === 'critical' ? 'Critical' : 'Minor'}
                          </span>
                          {report.status === 'resolved' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{report.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{report.location}</span>
                          {report.downtime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <FiClock className="w-3 h-3" />
                                <span>Downtime: {report.downtime}</span>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(report.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <FiLink className="w-4 h-4 text-gray-500 group-hover:text-sms-cyan transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No fault reports during this swing</p>
              </div>
            )}
          </div>
          
          {/* Daily Log Entries Section */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FiBook className="w-5 h-5 text-sms-cyan" />
                <span>Daily Log Entries</span>
                <span className="text-sm text-gray-400">({dailyLogEntries.length} total)</span>
              </h2>
              <select
                value={selectedLogCategory}
                onChange={(e) => setSelectedLogCategory(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-sms-cyan"
              >
                <option value="all">All Categories</option>
                <option value="equipment">Equipment Issues</option>
                <option value="maintenance">Maintenance Performed</option>
                <option value="safety">Safety Observations</option>
                <option value="general">General Notes</option>
              </select>
            </div>
            
            {dailyLogEntries.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dailyLogEntries
                  .filter(entry => selectedLogCategory === 'all' || entry.category === selectedLogCategory)
                  .map((entry) => {
                    const getCategoryStyle = (category: DailyLogEntry['category']) => {
                      switch (category) {
                        case 'equipment':
                          return { icon: FiAlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' };
                        case 'maintenance':
                          return { icon: FiTool, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' };
                        case 'safety':
                          return { icon: FiShield, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/30' };
                        case 'general':
                          return { icon: FiMessageSquare, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600' };
                      }
                    };
                    
                    const style = getCategoryStyle(entry.category);
                    const Icon = style.icon;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`${style.bg} border ${style.border} rounded-lg p-4`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`w-5 h-5 ${style.color} mt-0.5`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-white font-semibold">{entry.title}</h4>
                                {entry.importantForHandover && (
                                  <div className="flex items-center space-x-1 bg-amber-900/30 border border-amber-500/30 px-2 py-0.5 rounded">
                                    <FiStar className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs text-amber-400">Important</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{entry.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <FiClock className="w-3 h-3" />
                                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                              </span>
                              <span className={`text-xs ${style.color} capitalize`}>
                                {entry.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiBook className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No daily log entries found</p>
              </div>
            )}
          </div>
          
          {/* Parts Usage Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parts Used */}
            <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FiPackage className="w-5 h-5 text-orange-400" />
                <span>Parts Used During Swing</span>
              </h2>
              
              {partsUsed.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-sms-gray/30 rounded-lg p-2 mb-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400">
                      <div className="col-span-3">Part No.</div>
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2 text-center">Used</div>
                      <div className="col-span-2 text-center">Stock</div>
                    </div>
                  </div>
                  {partsUsed.map((part) => (
                    <div key={part.partNo} className="bg-sms-gray/50 rounded-lg p-3 border border-gray-700">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <p className="text-sm font-mono text-white">{part.partNo}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-sm text-gray-300">{part.name}</p>
                          <p className="text-xs text-gray-500">{part.category}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-sm text-white font-semibold">{part.quantityUsed}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className={`text-sm font-semibold ${
                            part.currentStock > 5 ? 'text-green-400' : 
                            part.currentStock > 2 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {part.currentStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No parts used during this shift</p>
              )}
            </div>
            
            {/* Low Stock Warning */}
            <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FiAlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Parts Running Low</span>
              </h2>
              
              {lowStockParts.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-400">
                      ⚠️ These parts are below reorder level. Procurement has been notified.
                    </p>
                  </div>
                  {lowStockParts.map((part) => (
                    <div key={part.partNo} className="bg-sms-gray/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-mono text-white">{part.partNo}</p>
                          <p className="text-sm text-gray-300">{part.name}</p>
                          <p className="text-xs text-gray-500">{part.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-400">{part.currentStock}</p>
                          <p className="text-xs text-gray-500">Reorder: {part.reorderLevel}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiCheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-50" />
                  <p>All parts are well stocked</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Manual Input Areas */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Swing Details</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-400">
                    Swing Summary <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleImportDailyLogs}
                    className="px-3 py-1 bg-sms-cyan/20 border border-sms-cyan/30 text-sms-cyan text-sm rounded-lg hover:bg-sms-cyan/30 transition-colors flex items-center space-x-1"
                  >
                    <FiFileText className="w-4 h-4" />
                    <span>Import Daily Logs</span>
                  </button>
                </div>
                <textarea
                  value={shiftSummary}
                  onChange={(e) => setShiftSummary(e.target.value)}
                  required
                  rows={8}
                  className="w-full px-4 py-3 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  placeholder="Provide a general overview of the shift, major activities, and overall equipment status..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Special Notes / Concerns
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  placeholder="Note any ongoing issues, safety concerns, or important information for the incoming technician..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Recommendations for Next Shift
                </label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                  placeholder="Suggest priority tasks, preventive maintenance, or areas requiring attention..."
                />
              </div>
            </div>
          </div>
          
          {/* Handover Notes Reference */}
          {handoverNotes.length > 0 && (
            <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <FiFileText className="w-5 h-5 text-sms-cyan" />
                  <span>Your Swing Notes</span>
                </h2>
                <span className="text-sm text-gray-400">{handoverNotes.length} notes</span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {handoverNotes.map((note) => (
                  <div key={note.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(note.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Reference these notes while completing the handover form above
              </p>
            </div>
          )}
          
          {/* Submit Section */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start space-x-3 mb-4">
              <FiCheckCircle className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Submit?</h3>
                <p className="text-sm text-gray-400">
                  By submitting this handover report, you confirm that all information is accurate and complete. 
                  The incoming technician will be notified, and you'll be cleared for disembarkation.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/technician')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 font-semibold rounded-lg hover:bg-blue-600/30 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    <span>Submit Handover & Enable Disembarkation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HandoverComplete;