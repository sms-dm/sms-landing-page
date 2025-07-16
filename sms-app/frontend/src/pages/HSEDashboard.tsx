import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TeamChatWidget from '../components/TeamChatWidget';
import { 
  FiAlertCircle, 
  FiShield,
  FiClipboard,
  FiActivity,
  FiFileText,
  FiAlertTriangle,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiCalendar,
  FiSun,
  FiMoon,
  FiPlus,
  FiX,
  FiChevronRight,
  FiAward,
  FiBook,
  FiEdit3,
  FiChevronDown,
  FiPower,
  FiUser,
  FiSettings,
  FiCamera,
  FiEdit,
  FiMessageCircle,
  FiHelpCircle,
  FiAnchor
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DailyLog from '../components/DailyLog';
import VesselSyncLoader from '../components/VesselSyncLoader';
import { useQuery } from '@tanstack/react-query';
import { companyAPI } from '../services/api';

interface UpcomingRequirement {
  id: string;
  type: 'drill' | 'certificate' | 'inspection' | 'training';
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  responsible?: string;
}

interface SafetyActivity {
  id: string;
  type: 'observation' | 'incident' | 'drill' | 'training' | 'inspection';
  description: string;
  timestamp: string;
  reporter: string;
  status?: 'open' | 'closed' | 'pending';
}

interface RotationDetails {
  startDate: string;
  endDate: string;
  shift: 'day' | 'night' | 'swing';
  rotationLength: number;
}

const HSEDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [selectedVessel] = useState(() => {
    const vesselId = localStorage.getItem('sms_selected_vessel');
    return vesselId || null;
  });
  const [rotation, setRotation] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<{days: number, hours: number, minutes: number} | null>(null);
  const [handoverCompleted, setHandoverCompleted] = useState(() => {
    return localStorage.getItem('sms_hse_handover_completed') === 'true';
  });
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showEarlyDepartureModal, setShowEarlyDepartureModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [earlyDepartureReason, setEarlyDepartureReason] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('sms_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [showProfilePicture, setShowProfilePicture] = useState(() => {
    return localStorage.getItem('sms_show_profile_pic') !== 'false';
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [rotationExtension, setRotationExtension] = useState<any | null>(() => {
    const saved = localStorage.getItem('sms_rotation_extension');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedVesselData, setSelectedVesselData] = useState<any>(null);
  const [showVesselSelection, setShowVesselSelection] = useState(!selectedVessel);
  const [showRotationSetup, setShowRotationSetup] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [rotationDetails, setRotationDetails] = useState<RotationDetails>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    shift: 'day',
    rotationLength: 28
  });

  // Fetch vessels for the user's company
  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels', user?.company.id],
    queryFn: () => companyAPI.getVessels(user!.company.id),
    select: (response) => response.data,
    enabled: !!user?.company.id && showVesselSelection,
    retry: 1,
  });

  // Upcoming safety requirements
  const [upcomingRequirements] = useState<UpcomingRequirement[]>([
    { id: '1', type: 'drill', title: 'Fire Drill - Engine Room', dueDate: '2025-01-08', priority: 'high', responsible: 'All Crew' },
    { id: '2', type: 'certificate', title: 'First Aid Cert Renewal - J. Smith', dueDate: '2025-01-15', priority: 'medium', responsible: 'John Smith' },
    { id: '3', type: 'inspection', title: 'Monthly Safety Equipment Check', dueDate: '2025-01-10', priority: 'high', responsible: 'HSE Team' },
    { id: '4', type: 'training', title: 'H2S Awareness Refresher', dueDate: '2025-01-20', priority: 'medium', responsible: 'Deck Crew' },
    { id: '5', type: 'drill', title: 'Man Overboard Drill', dueDate: '2025-01-12', priority: 'high', responsible: 'All Crew' },
    { id: '6', type: 'inspection', title: 'Lifeboat Equipment Inspection', dueDate: '2025-01-18', priority: 'high', responsible: 'HSE Officer' },
    { id: '7', type: 'certificate', title: 'STCW Certificate Renewal - M. Chen', dueDate: '2025-01-25', priority: 'medium', responsible: 'Mike Chen' },
    { id: '8', type: 'drill', title: 'Confined Space Entry Drill', dueDate: '2025-01-22', priority: 'medium', responsible: 'Maintenance Team' }
  ]);


  // Recent safety activities
  const [recentActivities] = useState<SafetyActivity[]>([
    { id: '1', type: 'observation', description: 'Slippery deck surface near crane area - barriers placed', timestamp: '2 hours ago', reporter: 'Mike Chen', status: 'open' },
    { id: '2', type: 'drill', description: 'Completed weekly abandon ship drill - all crew participated', timestamp: '5 hours ago', reporter: 'Captain Roberts', status: 'closed' },
    { id: '3', type: 'incident', description: 'Minor hand injury - First aid administered, TRIR updated', timestamp: '1 day ago', reporter: 'Sarah Johnson', status: 'closed' },
    { id: '4', type: 'training', description: 'Confined space entry training completed - 12 crew certified', timestamp: '2 days ago', reporter: 'HSE Officer', status: 'closed' },
    { id: '5', type: 'inspection', description: 'Weekly safety walkthrough - 3 observations raised', timestamp: '3 days ago', reporter: 'Tom Wilson', status: 'closed' },
    { id: '6', type: 'observation', description: 'Missing guard rail on upper deck - repair scheduled', timestamp: '3 days ago', reporter: 'John Doe', status: 'open' },
    { id: '7', type: 'drill', description: 'Fire drill conducted - response time 3 minutes', timestamp: '4 days ago', reporter: 'Chief Officer', status: 'closed' }
  ]);

  // Community posts for HSE network
  const [communityPosts] = useState([
    {
      id: 1,
      author: 'Sarah Martinez',
      vessel: 'MV Atlantic Pioneer',
      role: 'HSE Coordinator',
      content: 'New IMCA guidelines for lifting operations released. Key changes: Updated color coding for slings and mandatory pre-lift toolbox talks. Check your email for the full document.',
      likes: 45,
      replies: 12,
      time: '2 hours ago',
      tags: ['lifting-ops', 'IMCA', 'guidelines']
    },
    {
      id: 2,
      author: 'James Wilson',
      vessel: 'MV Northern Explorer',
      role: 'Senior HSE Officer',
      content: 'Successful implementation of Stop Work Authority program. 3 potential incidents prevented this month. Remember: No job is so urgent that we cannot take time to do it safely!',
      likes: 67,
      replies: 8,
      time: '5 hours ago',
      tags: ['stop-work', 'safety-culture', 'best-practice']
    },
    {
      id: 3,
      author: 'Maria Rodriguez',
      vessel: 'MV Pacific Guardian',
      role: 'HSE Manager',
      content: 'Sharing our new Job Safety Analysis template. Simplified format with risk matrix integration. Already seeing 40% faster completion times. DM me for the Excel file.',
      likes: 89,
      replies: 23,
      time: '1 day ago',
      tags: ['JSA', 'risk-assessment', 'tools']
    }
  ]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if user has selected a vessel
  useEffect(() => {
    if (!selectedVessel && !showVesselSelection) {
      setShowVesselSelection(true);
    }
  }, [selectedVessel, showVesselSelection]);

  // Load rotation details and calculate countdown
  useEffect(() => {
    const rotationData = localStorage.getItem('sms_rotation');
    if (rotationData) {
      const parsed = JSON.parse(rotationData);
      setRotation(parsed);
      
      // Calculate time remaining
      const updateCountdown = () => {
        const now = new Date();
        let endDate = new Date(parsed.endDate);
        
        // Apply extension if exists
        if (rotationExtension) {
          endDate = new Date(endDate.getTime() + (rotationExtension.days * 24 * 60 * 60 * 1000));
        }
        
        const diff = endDate.getTime() - now.getTime();
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining({ days, hours, minutes });
        } else {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [rotationExtension]);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  const handleLogout = () => {
    logout();
    navigate(`/${user?.company.slug || 'oceanic'}`);
  };

  // Theme toggle handler
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('sms_theme', newTheme ? 'dark' : 'light');
    toast.success(`Switched to ${newTheme ? 'dark' : 'light'} mode`, { duration: 2000 });
  };

  // Profile preference handlers
  const handleProfilePictureToggle = () => {
    const newValue = !showProfilePicture;
    setShowProfilePicture(newValue);
    localStorage.setItem('sms_show_profile_pic', newValue.toString());
  };

  const handleProfilePictureUpload = () => {
    toast.success('Profile picture upload feature coming soon!', { 
      duration: 3000,
      icon: '📸'
    });
  };

  // Vessel selection handlers
  const handleVesselSelect = (vessel: any) => {
    setSelectedVesselData(vessel);
    
    // Calculate end date based on rotation length
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + rotationDetails.rotationLength);
    setRotationDetails(prev => ({
      ...prev,
      endDate: endDate.toISOString().split('T')[0]
    }));
    
    setShowRotationSetup(true);
  };

  const handleRotationSubmit = () => {
    if (!rotationDetails.endDate) {
      toast.error('Please set your rotation end date');
      return;
    }

    // Store rotation details
    localStorage.setItem('sms_rotation', JSON.stringify({
      vesselId: selectedVesselData.id,
      ...rotationDetails,
      joinedAt: new Date().toISOString()
    }));
    
    localStorage.setItem('sms_selected_vessel', selectedVesselData.id.toString());
    setShowVesselSelection(false);
    setShowRotationSetup(false);
    setShowSync(true);
  };

  const handleSyncComplete = () => {
    setShowSync(false);
    window.location.reload(); // Reload to show dashboard with selected vessel
  };

  // Rotation extension handler
  const handleExtendRotation = () => {
    if (extensionDays < 1 || extensionDays > 30) {
      toast.error('Extension must be between 1 and 30 days');
      return;
    }

    const extension = {
      days: extensionDays,
      extendedAt: new Date().toISOString(),
      originalEndDate: rotation?.endDate
    };

    setRotationExtension(extension);
    localStorage.setItem('sms_rotation_extension', JSON.stringify(extension));
    setShowExtensionModal(false);
    toast.success(`Rotation extended by ${extensionDays} days`, { duration: 3000 });
  };

  // Early departure handler
  const handleEarlyDeparture = () => {
    if (!earlyDepartureReason.trim()) {
      toast.error('Please provide a reason for early departure');
      return;
    }

    // Log early departure
    const earlyDepartureLog = {
      reason: earlyDepartureReason,
      departedAt: new Date().toISOString(),
      originalEndDate: rotation?.endDate,
      handoverCompleted: true
    };

    localStorage.setItem('sms_early_departure', JSON.stringify(earlyDepartureLog));
    
    // Clear rotation data and go back to vessel selection
    localStorage.removeItem('sms_rotation');
    localStorage.removeItem('sms_selected_vessel');
    localStorage.removeItem('sms_hse_handover_completed');
    localStorage.removeItem('sms_rotation_extension');
    
    setShowVesselSelection(true);
    toast.success('Early departure completed. Safe travels!', { duration: 3000 });
  };

  const handleDisembark = () => {
    if (!handoverCompleted && timeRemaining && (timeRemaining.days === 0 && timeRemaining.hours < 24)) {
      toast.error('You must complete handover before disembarking!', { duration: 5000 });
      navigate('/hse/handover');
    } else if (!handoverCompleted) {
      toast.error('Handover must be completed within 24 hours of rotation end', { duration: 4000 });
    } else {
      // Clear rotation data and go back to vessel selection
      localStorage.removeItem('sms_rotation');
      localStorage.removeItem('sms_selected_vessel');
      localStorage.removeItem('sms_hse_handover_completed');
      localStorage.removeItem('sms_rotation_extension');
      setShowVesselSelection(true);
      toast.success('Successfully disembarked. Safe travels!', { duration: 3000 });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'incident':
        navigate('/hse/incident-report');
        break;
      case 'safety-walk':
        navigate('/hse/safety-walk');
        break;
      case 'drill':
        navigate('/hse/drill-management');
        break;
      case 'documentation':
        navigate('/hse/safety-documentation');
        break;
      default:
        toast.error('Feature coming soon');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'observation': return <FiAlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'incident': return <FiAlertCircle className="w-4 h-4 text-red-400" />;
      case 'drill': return <FiActivity className="w-4 h-4 text-blue-400" />;
      case 'training': return <FiAward className="w-4 h-4 text-purple-400" />;
      case 'inspection': return <FiClipboard className="w-4 h-4 text-green-400" />;
      default: return <FiFileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-900/20';
      case 'medium': return 'border-amber-500/30 bg-amber-900/20';
      case 'low': return 'border-gray-500/30 bg-gray-900/20';
      default: return 'border-gray-700';
    }
  };

  // Get current vessel name
  const getCurrentVesselName = () => {
    if (selectedVesselData) return selectedVesselData.name;
    const vessel = vessels.find((v: any) => v.id.toString() === selectedVessel);
    return vessel?.name || 'Unknown Vessel';
  };

  // If vessel not selected, show vessel selection
  if (showVesselSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray p-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {user?.company.logoUrl && (
                <img 
                  src={user.company.logoUrl} 
                  alt={user.company.name}
                  className="h-12"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.company.name}</h1>
                <p className="text-gray-400">Welcome, {user?.firstName} {user?.lastName} • HSE Officer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {!showRotationSetup ? (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">Select Vessel You Are Joining</h2>
            <p className="text-gray-400 mb-6">Choose the vessel for your upcoming rotation</p>
            
            {vesselsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-sms-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading vessels...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vessels.map((vessel: any) => (
                  <div
                    key={vessel.id}
                    onClick={() => handleVesselSelect(vessel)}
                    className="relative overflow-hidden rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-sms-cyan/20"
                    style={{
                      background: `linear-gradient(135deg, rgba(0,51,102,0.9) 0%, rgba(26,26,46,0.9) 100%)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '250px',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-sms-cyan/50"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-sms-cyan/50"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiAnchor className="text-sms-cyan" />
                        <span className="text-sm text-sms-cyan uppercase tracking-wider">{vessel.vessel_type}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{vessel.name}</h3>
                      <p className="text-gray-300 text-sm">IMO: {vessel.imo_number}</p>
                      <div className="mt-3 flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${vessel.status === 'operational' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-xs text-gray-400 capitalize">{vessel.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {vessels.length === 0 && !vesselsLoading && (
              <div className="text-center py-12">
                <FiAnchor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No vessels found for your company</p>
              </div>
            )}
          </div>
        ) : (
          // Rotation Setup Modal
          <div className="max-w-2xl mx-auto">
            <div className="bg-sms-gray/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <FiCalendar className="w-8 h-8 text-sms-cyan" />
                <h2 className="text-2xl font-bold text-white">Set Your Rotation Details</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300">Joining: <span className="text-white font-semibold">{selectedVesselData?.name}</span></p>
                <p className="text-sm text-gray-400 mt-1">Please confirm your rotation schedule</p>
              </div>

              <div className="space-y-6">
                {/* Rotation Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rotation Length
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[14, 21, 28, 35].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          setRotationDetails(prev => {
                            const startDate = new Date(prev.startDate);
                            const endDate = new Date(startDate);
                            endDate.setDate(startDate.getDate() + days);
                            return {
                              ...prev,
                              rotationLength: days,
                              endDate: endDate.toISOString().split('T')[0]
                            };
                          });
                        }}
                        className={`py-3 px-4 rounded-lg border transition-all ${
                          rotationDetails.rotationLength === days
                            ? 'bg-sms-cyan/20 border-sms-cyan text-white'
                            : 'bg-sms-dark/50 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={rotationDetails.startDate}
                    onChange={(e) => {
                      setRotationDetails(prev => {
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + prev.rotationLength);
                        return {
                          ...prev,
                          startDate: e.target.value,
                          endDate: endDate.toISOString().split('T')[0]
                        };
                      });
                    }}
                    className="w-full px-4 py-3 bg-sms-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                  />
                </div>

                {/* Shift Pattern */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Shift Pattern
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['day', 'night', 'swing'] as const).map((shift) => (
                      <button
                        key={shift}
                        onClick={() => setRotationDetails(prev => ({ ...prev, shift }))}
                        className={`py-3 px-4 rounded-lg border transition-all capitalize ${
                          rotationDetails.shift === shift
                            ? 'bg-sms-cyan/20 border-sms-cyan text-white'
                            : 'bg-sms-dark/50 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {shift === 'swing' ? '12hr Swing' : `${shift} Shift`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiHelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-semibold text-sm">Important: HSE Handover Required</p>
                      <p className="text-gray-300 text-sm mt-1">
                        You must complete a comprehensive HSE handover before your rotation ends. 
                        This includes safety observations, incidents, drills completed, and recommendations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowRotationSetup(false)}
                    className="flex-1 py-3 px-4 bg-sms-dark border border-gray-600 rounded-lg text-gray-300 hover:bg-sms-dark/80 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRotationSubmit}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-sms-cyan to-blue-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-sms-cyan/30 transition-all"
                  >
                    Confirm & Join Vessel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vessel Sync Loader */}
        {showSync && selectedVesselData && (
          <VesselSyncLoader
            vesselName={selectedVesselData.name}
            companyName={user!.company.name}
            companyLogo={user!.company.logoUrl}
            onComplete={handleSyncComplete}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-sms-dark to-sms-gray' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-sms-dark/80 border-gray-700' : 'bg-white/80 border-gray-300'} backdrop-blur-sm border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>HSE Officer Dashboard</h1>
                <div className="flex items-center space-x-2">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.firstName} {user?.lastName} • Health, Safety & Environment</p>
                  {/* Profile Dropdown Button */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-all flex items-center space-x-1 group"
                      title="Profile settings"
                    >
                      <FiUser className="w-4 h-4 text-gray-400 group-hover:text-sms-cyan" />
                      <FiChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-sms-cyan transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Profile Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-sms-dark border border-gray-700 rounded-lg shadow-xl z-50">
                        {/* Profile Info */}
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center space-x-3">
                            {showProfilePicture ? (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sms-cyan to-blue-600 p-0.5">
                                <div className="w-full h-full rounded-full bg-sms-dark flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                <FiUser className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                              <p className="text-xs text-gray-400">ID: {user?.id?.toString().slice(0, 8)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Theme Toggle */}
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {isDarkMode ? <FiMoon className="w-4 h-4 text-gray-400" /> : <FiSun className="w-4 h-4 text-yellow-400" />}
                              <span className="text-sm text-gray-300">Theme</span>
                            </div>
                            <button
                              onClick={handleThemeToggle}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                isDarkMode ? 'bg-sms-cyan' : 'bg-gray-600'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{isDarkMode ? 'Dark mode' : 'Light mode'} active</p>
                        </div>
                        
                        {/* Profile Picture Toggle */}
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Show Profile Picture</span>
                            <button
                              onClick={handleProfilePictureToggle}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                showProfilePicture ? 'bg-sms-cyan' : 'bg-gray-600'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  showProfilePicture ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              navigate('/profile/edit');
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiEdit className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">Edit Profile</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              handleProfilePictureUpload();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiCamera className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">Upload Picture</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiSettings className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">More Settings</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Rotation Countdown */}
              {timeRemaining && (
                <div className={`relative px-4 py-2 rounded-lg ${
                  timeRemaining.days <= 1 ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-sms-dark/60 border border-gray-600'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FiClock className={`w-5 h-5 ${timeRemaining.days <= 1 ? 'text-amber-500' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">Rotation Ends</p>
                        {rotationExtension && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                            Extended +{rotationExtension.days}d
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${
                        timeRemaining.days <= 1 ? 'text-amber-400' : 'text-white'
                      }`}>
                        {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                      </p>
                    </div>
                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors group relative"
                      title="Extend rotation"
                    >
                      <FiPlus className="w-4 h-4 text-gray-400 group-hover:text-sms-cyan" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Daily Log Button */}
              <div className="relative group">
                <button
                  onClick={() => setShowDailyLog(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-sms-dark/60 border border-gray-600 hover:border-sms-cyan rounded-lg transition-all"
                >
                  <FiBook className="w-4 h-4 text-gray-400 group-hover:text-sms-cyan" />
                  <div className="text-left">
                    <p className="text-xs text-gray-400 group-hover:text-sms-cyan font-semibold">Daily Log</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-400">Current Vessel</p>
                <p className="text-sm text-white font-semibold">{getCurrentVesselName()}</p>
              </div>
              
              <button
                onClick={() => {
                  if (handoverCompleted && timeRemaining && (timeRemaining.days > 0 || timeRemaining.hours > 0)) {
                    setShowEarlyDepartureModal(true);
                  } else {
                    handleDisembark();
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  handoverCompleted 
                    ? 'bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30'
                    : 'bg-gray-700 border border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
                title={handoverCompleted ? 'Disembark vessel' : 'Complete handover first'}
              >
                <FiLogOut className="w-4 h-4" />
                <span className="text-sm">
                  {handoverCompleted && timeRemaining && (timeRemaining.days > 0 || timeRemaining.hours > 0) 
                    ? 'Early Departure' 
                    : 'Disembark'
                  }
                </span>
              </button>
              
              <button
                onClick={() => {
                  logout();
                  navigate(`/${user?.company.slug || 'oceanic'}`);
                }}
                className="relative p-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-red-600/20 hover:border-red-500/30 transition-all group"
              >
                <FiPower className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Safety Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickAction('incident')}
              className="bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-xl p-6 transition-all duration-300 hover:scale-105"
            >
              <FiAlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Report Incident</p>
            </button>

            <button
              onClick={() => handleQuickAction('safety-walk')}
              className="bg-green-900/20 hover:bg-green-900/30 border border-green-500/30 rounded-xl p-6 transition-all duration-300 hover:scale-105"
            >
              <FiShield className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Safety Walk</p>
            </button>

            <button
              onClick={() => handleQuickAction('drill')}
              className="bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:scale-105"
            >
              <FiActivity className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Drill Management</p>
            </button>

            <button
              onClick={() => handleQuickAction('documentation')}
              className="bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 rounded-xl p-6 transition-all duration-300 hover:scale-105"
            >
              <FiFileText className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Safety Documentation</p>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Safety Requirements */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiCalendar className="w-5 h-5 mr-2 text-amber-400" />
                Upcoming Safety Requirements
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingRequirements.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 border rounded-lg transition-all hover:scale-[1.01] cursor-pointer ${getPriorityColor(req.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {req.type === 'drill' && <FiActivity className="w-4 h-4 text-blue-400" />}
                          {req.type === 'certificate' && <FiAward className="w-4 h-4 text-amber-400" />}
                          {req.type === 'inspection' && <FiClipboard className="w-4 h-4 text-green-400" />}
                          {req.type === 'training' && <FiBook className="w-4 h-4 text-purple-400" />}
                          <h4 className="text-sm font-medium text-white">{req.title}</h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">Due: {new Date(req.dueDate).toLocaleDateString()}</p>
                          {req.responsible && (
                            <p className="text-xs text-gray-500">• {req.responsible}</p>
                          )}
                        </div>
                      </div>
                      <FiChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Safety Activities */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiClock className="w-5 h-5 mr-2 text-blue-400" />
                Recent Safety Activities
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-sms-gray/20 rounded-lg hover:bg-sms-gray/30 transition-colors">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">{activity.reporter} • {activity.timestamp}</p>
                        {activity.status && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            activity.status === 'closed' ? 'bg-green-900/20 text-green-400' :
                            activity.status === 'open' ? 'bg-amber-900/20 text-amber-400' :
                            'bg-gray-900/20 text-gray-400'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Handover Section */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FiClipboard className="w-5 h-5 mr-2 text-green-400" />
                  HSE Handover Status
                </h3>
                <button
                  onClick={() => navigate('/hse/handover')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    handoverCompleted 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                      : 'bg-amber-900/20 border border-amber-500/30 text-amber-400 hover:bg-amber-900/30'
                  }`}
                >
                  {handoverCompleted ? 'View Handover' : 'Complete Handover'}
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="bg-sms-gray/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Required Handover Items:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <FiCheckCircle className={`w-4 h-4 ${handoverCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={handoverCompleted ? 'text-gray-300' : 'text-gray-500'}>Safety observations during swing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiCheckCircle className={`w-4 h-4 ${handoverCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={handoverCompleted ? 'text-gray-300' : 'text-gray-500'}>Incidents reported/resolved</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiCheckCircle className={`w-4 h-4 ${handoverCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={handoverCompleted ? 'text-gray-300' : 'text-gray-500'}>Drills completed</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiCheckCircle className={`w-4 h-4 ${handoverCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={handoverCompleted ? 'text-gray-300' : 'text-gray-500'}>Outstanding safety issues</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FiCheckCircle className={`w-4 h-4 ${handoverCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={handoverCompleted ? 'text-gray-300' : 'text-gray-500'}>Recommendations for next HSE officer</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Community Chat for HSE Network */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FiUsers className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">HSE Network Chat</h3>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                Connect with HSE officers across the fleet. Share best practices, safety alerts, and get support from the HSE community.
              </p>
              
              <div className="space-y-3 mb-4">
                <div className="bg-purple-800/20 rounded-lg p-3 text-sm">
                  <p className="text-purple-300 font-medium">Latest from Fleet:</p>
                  <p className="text-gray-300 text-xs mt-1">MV Atlantic: "New COVID protocols effective immediately - check your email"</p>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-3 text-sm">
                  <p className="text-purple-300 font-medium">Safety Alert:</p>
                  <p className="text-gray-300 text-xs mt-1">Industry-wide: "Increased focus on dropped object prevention after recent incidents"</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/hse/community-chat')}
                className="w-full py-3 bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/40 hover:text-purple-200 transition-all flex items-center justify-center space-x-2"
              >
                <FiMessageCircle className="w-5 h-5" />
                <span className="font-semibold">Join HSE Network</span>
              </button>
            </div>

            {/* Daily Safety Observations */}
            <div className="bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiEdit3 className="w-5 h-5 mr-2 text-sms-cyan" />
                Daily Safety Observations
              </h3>
              
              <button
                onClick={() => setShowDailyLog(true)}
                className="w-full py-4 bg-sms-cyan/20 hover:bg-sms-cyan/30 border border-sms-cyan/30 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <FiEdit3 className="w-5 h-5" />
                <span className="font-medium">Update Daily Safety Log</span>
              </button>
              
              <div className="mt-4 p-3 bg-sms-gray/20 rounded text-xs text-gray-400">
                <p>Today's entries: 3 observations</p>
                <p className="mt-1">This week: 12 total entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* HSE Community Board */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FiUsers className="w-6 h-6 text-sms-cyan" />
              <h2 className="text-lg font-semibold text-white">HSE Community Board</h2>
              <span className="text-xs bg-sms-cyan/20 text-sms-cyan px-2 py-1 rounded-full">Company-Wide</span>
            </div>
            <button
              onClick={() => navigate('/hse/community/new-post')}
              className="flex items-center space-x-2 px-4 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg hover:bg-sms-cyan/30 transition-all"
            >
              <FiPlus className="w-4 h-4 text-sms-cyan" />
              <span className="text-sm text-sms-cyan">Share Safety Tip</span>
            </button>
          </div>

          <div className="space-y-4">
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sms-cyan to-blue-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-sms-dark flex items-center justify-center">
                        <span className="text-white font-semibold">{post.author.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-semibold">{post.author}</h4>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{post.role}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{post.vessel}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{post.time}</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mt-3">{post.content}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-sms-dark/60 text-sms-cyan px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-6 mt-4">
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-sms-cyan transition-colors">
                        <FiHelpCircle className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-sms-cyan transition-colors">
                        <FiMessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.replies} replies</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/hse/community')}
            className="w-full mt-4 py-3 text-center text-sm text-sms-cyan hover:text-white border border-gray-700 hover:border-sms-cyan rounded-lg transition-all"
          >
            View All HSE Community Posts →
          </button>
        </div>
      </div>

      {/* Rotation Extension Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sms-dark border border-gray-700 rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiClock className="w-6 h-6 text-sms-cyan" />
                  <h2 className="text-xl font-semibold text-white">Extend Rotation</h2>
                </div>
                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                Extend your rotation period by additional days. Maximum extension is 30 days.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Extension Duration (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                  />
                  <div className="text-sm text-gray-400">
                    <p>Current: {rotation && new Date(rotation.endDate).toLocaleDateString()}</p>
                    <p className="text-sms-cyan">
                      New: {rotation && new Date(new Date(rotation.endDate).getTime() + (extensionDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Important</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Extensions should be coordinated with your supervisor and relief HSE officer.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="flex-1 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendRotation}
                  className="flex-1 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg text-sms-cyan hover:bg-sms-cyan/30 transition-all font-semibold"
                >
                  Extend Rotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Early Departure Modal */}
      {showEarlyDepartureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sms-dark border border-gray-700 rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiLogOut className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-semibold text-white">Early Departure</h2>
                </div>
                <button
                  onClick={() => setShowEarlyDepartureModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-400">Handover Complete</p>
                    <p className="text-xs text-gray-400 mt-1">
                      All HSE handover items are complete. You may depart early if needed.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4">
                You are departing {timeRemaining ? `${timeRemaining.days} days and ${timeRemaining.hours} hours` : ''} before your scheduled rotation end.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Reason for Early Departure <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={earlyDepartureReason}
                  onChange={(e) => setEarlyDepartureReason(e.target.value)}
                  placeholder="Please provide a reason (e.g., family emergency, medical, approved leave, etc.)"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEarlyDepartureModal(false)}
                  className="flex-1 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEarlyDeparture}
                  className="flex-1 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-600/30 transition-all font-semibold"
                >
                  Confirm Early Departure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Log Modal */}
      <DailyLog
        isOpen={showDailyLog}
        onClose={() => setShowDailyLog(false)}
        rotation={rotation}
      />
      
      {/* Team Chat Widget */}
      <TeamChatWidget defaultOpen={false} />
    </div>
  );
};

export default HSEDashboard;