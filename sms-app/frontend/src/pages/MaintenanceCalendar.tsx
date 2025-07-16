import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFilter, 
  FiFileText, 
  FiDownload,
  FiX,
  FiClock,
  FiUser,
  FiTool,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface MaintenanceTask {
  id: string;
  equipmentName: string;
  equipmentType: string;
  maintenanceType: string;
  duration: string;
  assignedTech: string;
  status: 'scheduled' | 'overdue' | 'completed' | 'upcoming';
  date: Date;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

const MaintenanceCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterEquipmentType, setFilterEquipmentType] = useState('all');
  const [filterMaintenanceType, setFilterMaintenanceType] = useState('all');

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock maintenance data
  const maintenanceTasks: MaintenanceTask[] = [
    // Overdue tasks
    {
      id: '1',
      equipmentName: 'Top Drive VFD #1',
      equipmentType: 'VFD',
      maintenanceType: 'Preventive',
      duration: '4 hours',
      assignedTech: 'John Smith',
      status: 'overdue',
      date: new Date(2025, 6, 28),
      priority: 'high',
      description: 'Annual VFD inspection and cleaning'
    },
    {
      id: '2',
      equipmentName: 'Mud Pump #2',
      equipmentType: 'Pump',
      maintenanceType: 'Inspection',
      duration: '2 hours',
      assignedTech: 'Mike Chen',
      status: 'overdue',
      date: new Date(2025, 6, 29),
      priority: 'high',
      description: 'Quarterly pump inspection'
    },
    // Completed tasks
    {
      id: '3',
      equipmentName: 'SCR System #1',
      equipmentType: 'SCR',
      maintenanceType: 'Calibration',
      duration: '3 hours',
      assignedTech: 'Sarah Williams',
      status: 'completed',
      date: new Date(2025, 6, 30),
      priority: 'medium',
      description: 'Monthly SCR calibration'
    },
    {
      id: '4',
      equipmentName: 'Emergency Generator',
      equipmentType: 'Generator',
      maintenanceType: 'Testing',
      duration: '1 hour',
      assignedTech: 'Tom Rodriguez',
      status: 'completed',
      date: new Date(2025, 7, 1),
      priority: 'medium',
      description: 'Weekly generator test run'
    },
    // Upcoming tasks (within 7 days)
    {
      id: '5',
      equipmentName: 'Draw Works Motor',
      equipmentType: 'Motor',
      maintenanceType: 'Lubrication',
      duration: '1.5 hours',
      assignedTech: 'John Smith',
      status: 'upcoming',
      date: new Date(2025, 7, 5),
      priority: 'medium',
      description: 'Monthly motor lubrication'
    },
    {
      id: '6',
      equipmentName: 'Rotary Table',
      equipmentType: 'Mechanical',
      maintenanceType: 'Inspection',
      duration: '2 hours',
      assignedTech: 'Mike Chen',
      status: 'upcoming',
      date: new Date(2025, 7, 7),
      priority: 'low',
      description: 'Bi-weekly rotary table inspection'
    },
    // Scheduled tasks
    {
      id: '7',
      equipmentName: 'Top Drive Motor',
      equipmentType: 'Motor',
      maintenanceType: 'Overhaul',
      duration: '8 hours',
      assignedTech: 'Sarah Williams',
      status: 'scheduled',
      date: new Date(2025, 7, 15),
      priority: 'high',
      description: 'Annual motor overhaul'
    },
    {
      id: '8',
      equipmentName: 'VFD Cooling System',
      equipmentType: 'VFD',
      maintenanceType: 'Cleaning',
      duration: '2 hours',
      assignedTech: 'Tom Rodriguez',
      status: 'scheduled',
      date: new Date(2025, 7, 20),
      priority: 'low',
      description: 'Quarterly cooling system cleaning'
    },
    {
      id: '9',
      equipmentName: 'Mud Pump #1',
      equipmentType: 'Pump',
      maintenanceType: 'Valve Replacement',
      duration: '6 hours',
      assignedTech: 'John Smith',
      status: 'scheduled',
      date: new Date(2025, 7, 25),
      priority: 'high',
      description: 'Scheduled valve replacement'
    },
    // More tasks for different dates
    {
      id: '10',
      equipmentName: 'SCR System #2',
      equipmentType: 'SCR',
      maintenanceType: 'Software Update',
      duration: '1 hour',
      assignedTech: 'Mike Chen',
      status: 'scheduled',
      date: new Date(2025, 7, 10),
      priority: 'medium',
      description: 'Firmware update v2.3.1'
    },
    {
      id: '11',
      equipmentName: 'Emergency Stop System',
      equipmentType: 'Safety',
      maintenanceType: 'Testing',
      duration: '30 minutes',
      assignedTech: 'Sarah Williams',
      status: 'upcoming',
      date: new Date(2025, 7, 3),
      priority: 'high',
      description: 'Monthly E-stop system test'
    },
    {
      id: '12',
      equipmentName: 'Power Distribution Panel',
      equipmentType: 'Electrical',
      maintenanceType: 'Thermal Imaging',
      duration: '2 hours',
      assignedTech: 'Tom Rodriguez',
      status: 'scheduled',
      date: new Date(2025, 7, 18),
      priority: 'medium',
      description: 'Quarterly thermal scan'
    }
  ];

  // Get filtered tasks
  const filteredTasks = useMemo(() => {
    return maintenanceTasks.filter(task => {
      if (filterEquipmentType !== 'all' && task.equipmentType !== filterEquipmentType) {
        return false;
      }
      if (filterMaintenanceType !== 'all' && task.maintenanceType !== filterMaintenanceType) {
        return false;
      }
      return true;
    });
  }, [filterEquipmentType, filterMaintenanceType]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => 
      task.date.getDate() === date.getDate() &&
      task.date.getMonth() === date.getMonth() &&
      task.date.getFullYear() === date.getFullYear()
    );
  };

  // Get day status for calendar coloring
  const getDayStatus = (date: Date): string => {
    const tasks = getTasksForDate(date);
    if (tasks.length === 0) return 'none';
    
    const statuses = tasks.map(task => task.status);
    if (statuses.includes('overdue')) return 'overdue';
    if (statuses.includes('upcoming')) return 'upcoming';
    if (statuses.includes('completed')) return 'completed';
    if (statuses.includes('scheduled')) return 'scheduled';
    
    return 'none';
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Handle day click
  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const tasks = getTasksForDate(date);
      if (tasks.length > 0) {
        setShowModal(true);
      }
    }
  };

  // Get upcoming tasks for sidebar
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredTasks
      .filter(task => task.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [filteredTasks]);

  // Generate report
  const generateReport = () => {
    toast.success('Generating maintenance report...', { duration: 2000 });
    // In a real app, this would generate a PDF report
  };

  // Export functions
  const exportToPDF = () => {
    toast.success('Exporting to PDF...', { duration: 2000 });
    // In a real app, this would export to PDF
  };

  const exportToExcel = () => {
    toast.success('Exporting to Excel...', { duration: 2000 });
    // In a real app, this would export to Excel
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Maintenance Calendar</h1>
                <p className="text-sm text-gray-400">Schedule and track all maintenance activities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-all hover:scale-110"
                >
                  <FiChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-all hover:scale-110"
                >
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const status = getDayStatus(date);
                  const tasks = getTasksForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => handleDayClick(date)}
                      className={`
                        aspect-square p-2 rounded-lg border cursor-pointer
                        transition-all duration-300 hover:scale-105 hover:shadow-lg
                        ${isToday ? 'ring-2 ring-sms-cyan' : ''}
                        ${status === 'overdue' ? 'bg-red-900/30 border-red-500/50 hover:bg-red-900/40 hover:border-red-500' : ''}
                        ${status === 'completed' ? 'bg-green-900/30 border-green-500/50 hover:bg-green-900/40 hover:border-green-500' : ''}
                        ${status === 'upcoming' ? 'bg-yellow-900/30 border-yellow-500/50 hover:bg-yellow-900/40 hover:border-yellow-500' : ''}
                        ${status === 'scheduled' ? 'bg-blue-900/30 border-blue-500/50 hover:bg-blue-900/40 hover:border-blue-500' : ''}
                        ${status === 'none' ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600' : ''}
                      `}
                    >
                      <div className="h-full flex flex-col">
                        <div className="text-sm font-semibold text-white mb-1">
                          {date.getDate()}
                        </div>
                        {tasks.length > 0 && (
                          <div className="flex-1 flex flex-col justify-end">
                            <div className="text-xs text-gray-300">
                              {tasks.length} task{tasks.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-900/30 border border-red-500/50 rounded"></div>
                  <span className="text-xs text-gray-400">Overdue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-900/30 border border-green-500/50 rounded"></div>
                  <span className="text-xs text-gray-400">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-900/30 border border-yellow-500/50 rounded"></div>
                  <span className="text-xs text-gray-400">Upcoming (7 days)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-900/30 border border-blue-500/50 rounded"></div>
                  <span className="text-xs text-gray-400">Scheduled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Maintenance */}
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiClock className="w-5 h-5 mr-2 text-sms-cyan" />
                Upcoming Maintenance
              </h3>
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-sms-dark/60 border border-gray-600 rounded-lg hover:border-gray-500 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedDate(task.date);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold text-white">{task.equipmentName}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{task.maintenanceType}</p>
                    <p className="text-xs text-gray-500">
                      {task.date.toLocaleDateString()} • {task.duration}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiFilter className="w-5 h-5 mr-2 text-sms-cyan" />
                Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Equipment Type</label>
                  <select
                    value={filterEquipmentType}
                    onChange={(e) => setFilterEquipmentType(e.target.value)}
                    className="w-full bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-sms-cyan focus:outline-none transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="VFD">VFD</option>
                    <option value="Pump">Pump</option>
                    <option value="Motor">Motor</option>
                    <option value="SCR">SCR</option>
                    <option value="Generator">Generator</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Maintenance Type</label>
                  <select
                    value={filterMaintenanceType}
                    onChange={(e) => setFilterMaintenanceType(e.target.value)}
                    className="w-full bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-sms-cyan focus:outline-none transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Testing">Testing</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Lubrication">Lubrication</option>
                    <option value="Overhaul">Overhaul</option>
                    <option value="Software Update">Software Update</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={generateReport}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg hover:bg-sms-cyan/30 transition-all"
                >
                  <FiFileText className="w-4 h-4 text-sms-cyan" />
                  <span className="text-sm text-sms-cyan">Generate Report</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all"
                >
                  <FiDownload className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Export PDF</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all"
                >
                  <FiDownload className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">Export Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sms-gray border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  Maintenance Tasks - {selectedDate.toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {getTasksForDate(selectedDate).map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                      task.status === 'overdue' ? 'bg-red-900/20 border-red-500/30' :
                      task.status === 'completed' ? 'bg-green-900/20 border-green-500/30' :
                      task.status === 'upcoming' ? 'bg-yellow-900/20 border-yellow-500/30' :
                      'bg-blue-900/20 border-blue-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{task.equipmentName}</h3>
                        <p className="text-sm text-gray-400">{task.equipmentType} • {task.maintenanceType}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {task.priority} priority
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-300 mb-3">{task.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Duration: {task.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Tech: {task.assignedTech}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center space-x-2">
                      <FiTool className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${
                        task.status === 'overdue' ? 'text-red-400' :
                        task.status === 'completed' ? 'text-green-400' :
                        task.status === 'upcoming' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        Status: {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {getTasksForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8">
                    <FiCalendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No maintenance tasks scheduled for this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceCalendar;