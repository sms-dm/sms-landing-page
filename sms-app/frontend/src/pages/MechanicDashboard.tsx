import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiCamera, FiClipboard, FiTruck, FiGrid, FiCalendar, FiMessageSquare, FiFileText, FiPackage, FiAlertOctagon, FiUsers, FiHeart, FiMessageCircle, FiCpu, FiPlus, FiClock, FiLogOut, FiPower, FiUser, FiEdit, FiSun, FiMoon, FiSettings, FiX, FiChevronDown, FiEdit3, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';
import TooltipButton from '../components/TooltipButton';
import DailyLog from '../components/DailyLog';
import TeamChatWidget from '../components/TeamChatWidget';


interface RotationExtension {
  days: number;
  extendedAt: string;
  originalEndDate: string;
}

const MechanicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedVessel] = useState(() => {
    const vesselId = localStorage.getItem('sms_selected_vessel');
    return vesselId || null;
  });
  const [rotation, setRotation] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<{days: number, hours: number, minutes: number} | null>(null);
  const [handoverCompleted, setHandoverCompleted] = useState(() => {
    return localStorage.getItem('sms_handover_completed') === 'true';
  });
  const [rotationExtension, setRotationExtension] = useState<RotationExtension | null>(() => {
    const saved = localStorage.getItem('sms_rotation_extension');
    return saved ? JSON.parse(saved) : null;
  });
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showEarlyDepartureModal, setShowEarlyDepartureModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [earlyDepartureReason, setEarlyDepartureReason] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('sms_theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark mode
  });
  const [showProfilePicture, setShowProfilePicture] = useState(() => {
    return localStorage.getItem('sms_show_profile_pic') !== 'false';
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [showDailyLog, setShowDailyLog] = useState(false);

  // Calculate handover progress (visual indicator only)
  const handoverProgress = handoverCompleted ? 100 : 0;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    
    // Check handover status periodically
    const checkHandover = () => {
      const status = localStorage.getItem('sms_handover_completed') === 'true';
      setHandoverCompleted(status);
    };
    
    checkHandover();
    const handoverInterval = setInterval(checkHandover, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(handoverInterval);
    };
  }, [rotationExtension]);

  // Apply theme to document
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
    // In a real implementation, this would open a file picker
    // For now, we'll just show a toast notification
    toast.success('Profile picture upload feature coming soon!', { 
      duration: 3000,
      icon: '📸'
    });
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
    localStorage.removeItem('sms_handover_completed');
    localStorage.removeItem('sms_rotation_extension');
    
    navigate('/vessels');
    toast.success('Early departure completed. Safe travels!', { duration: 3000 });
  };

  // Quick action button handlers
  const handleCriticalFault = () => {
    navigate('/fault/critical');
    toast.error('Critical Fault Mode - Select Equipment', { duration: 3000 });
  };

  const handleMinorFault = () => {
    navigate('/fault/minor');
    toast('Minor Fault Mode - Select Equipment', { 
      icon: '⚠️',
      duration: 3000 
    });
  };

  const handleQRScanner = () => {
    navigate('/equipment/scan');
  };

  const handleHandover = () => {
    navigate('/handover/complete');
  };

  const handleEmergencyOrder = () => {
    navigate('/emergency-order');
    toast.error('Emergency Order Mode', { duration: 2000 });
  };

  const handleDisembark = () => {
    if (!handoverCompleted && timeRemaining && (timeRemaining.days === 0 && timeRemaining.hours < 24)) {
      toast.error('You must complete handover before disembarking!', { duration: 5000 });
      navigate('/handover/complete');
    } else if (!handoverCompleted) {
      toast.error('Handover must be completed within 24 hours of rotation end', { duration: 4000 });
    } else {
      // Clear rotation data and go back to vessel selection
      localStorage.removeItem('sms_rotation');
      localStorage.removeItem('sms_selected_vessel');
      localStorage.removeItem('sms_handover_completed');
      localStorage.removeItem('sms_rotation_extension');
      navigate('/vessels');
      toast.success('Successfully disembarked. Safe travels!', { duration: 3000 });
    }
  };

  // Main section navigation
  const handleSectionClick = (section: string) => {
    const routes: Record<string, string> = {
      equipment: '/equipment/management',
      calendar: '/maintenance',
      records: '/records',
      inventory: '/inventory',
      community: '/community'
    };
    navigate(routes[section] || `/${section}`);
  };

  // Mock data for demo
  const hseUpdates = [
    {
      id: 1,
      type: 'drill',
      title: 'Fire Drill Scheduled',
      content: 'Mandatory fire drill tomorrow at 14:00. Muster at lifeboat stations.',
      date: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'nearmiss',
      title: 'Near Miss: Dropped Object',
      content: 'Wrench dropped from height on main deck. Area now marked with barriers.',
      date: '5 hours ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'update',
      title: 'New PPE Requirements',
      content: 'Updated helmet chin strap policy effective immediately.',
      date: 'Yesterday',
      priority: 'low'
    }
  ];

  const communityPosts = [
    {
      id: 1,
      author: 'John Anderson',
      vessel: 'MV Northern Pioneer',
      role: 'Senior Mechanic',
      avatar: '/assets/avatars/john.jpg',
      content: 'Pro tip: When checking bearing temperatures on the mud pumps, always take readings at the same points. Inconsistent measurement locations can give false temperature spikes!',
      likes: 28,
      replies: 7,
      time: '3 hours ago',
      tags: ['bearings', 'mud-pumps', 'temperature-monitoring']
    },
    {
      id: 2,
      author: 'Maria Garcia',
      vessel: 'MV Atlantic Guardian',
      role: 'Lead Mechanic',
      avatar: '/assets/avatars/maria.jpg',
      content: 'Anyone else noticed increased vibration on the drawworks after the last service? Started measuring unusual harmonics at 2x running speed.',
      likes: 19,
      replies: 15,
      time: '8 hours ago',
      tags: ['drawworks', 'vibration', 'harmonics']
    },
    {
      id: 3,
      author: 'Dave Thompson',
      vessel: 'MV Pacific Explorer',
      role: 'Mechanical Specialist',
      avatar: '/assets/avatars/dave.jpg',
      content: 'Just completed compressor overhaul. Remember to check intercooler efficiency after valve replacements - saved us from a major failure!',
      likes: 42,
      replies: 9,
      time: 'Yesterday',
      tags: ['compressor', 'maintenance', 'intercooler']
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-sms-dark to-sms-gray' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-sms-dark/80 border-gray-700' : 'bg-white/80 border-gray-300'} backdrop-blur-sm border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mechanic Dashboard</h1>
                <div className="flex items-center space-x-2">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.firstName} {user?.lastName} • Mechanical Specialist</p>
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
                      <span className="absolute -bottom-8 right-0 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Extend rotation
                      </span>
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
                <div className="absolute top-full mt-2 left-0 bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  <p className="text-xs text-gray-300">Record daily activities, maintenance, and</p>
                  <p className="text-xs text-gray-300">observations for your handover</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-400">Current Vessel</p>
                <p className="text-sm text-white font-semibold">MV Pacific Explorer</p>
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
                <span className="absolute -bottom-8 right-0 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Quick Action Buttons - NOW AT THE TOP */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Critical Fault - Red */}
            <div className="relative group">
              <button
                onClick={handleCriticalFault}
                className="relative overflow-hidden bg-red-900/20 border border-red-500/30 hover:border-red-500 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiAlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Critical Fault</p>
                <p className="text-xs text-red-400 mt-1">Urgent Response</p>
              </button>
              <div className="absolute -bottom-12 left-0 bg-sms-dark border border-red-500/30 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-red-400 font-semibold">Major Equipment Failure</p>
                <p className="text-xs text-gray-400">Get immediate help with AI & diagnostic tools</p>
              </div>
            </div>

            {/* Minor Fault - Amber */}
            <div className="relative group">
              <button
                onClick={handleMinorFault}
                className="relative overflow-hidden bg-amber-900/20 border border-amber-500/30 hover:border-amber-500 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/0 via-amber-600/10 to-amber-600/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiAlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Minor Fault</p>
                <p className="text-xs text-amber-400 mt-1">Non-Urgent</p>
              </button>
              <div className="absolute -bottom-12 left-0 bg-sms-dark border border-amber-500/30 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-amber-400 font-semibold">Non-Critical Issue</p>
                <p className="text-xs text-gray-400">Access troubleshooting resources at your pace</p>
              </div>
            </div>

            {/* QR Scanner */}
            <div className="relative group">
              <button
                onClick={handleQRScanner}
                className="relative overflow-hidden bg-sms-gray border border-gray-600 hover:border-sms-cyan rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-sms-cyan/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sms-cyan/0 via-sms-cyan/10 to-sms-cyan/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiCamera className="w-8 h-8 text-sms-cyan mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">QR Scanner</p>
                <p className="text-xs text-gray-400 mt-1">Scan Equipment</p>
              </button>
              <div className="absolute -bottom-12 right-0 bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-sms-cyan font-semibold">Quick Equipment Access</p>
                <p className="text-xs text-gray-400">Scan QR code to view equipment details</p>
              </div>
            </div>

            {/* Emergency Order */}
            <div className="relative group">
              <button
                onClick={handleEmergencyOrder}
                className="relative overflow-hidden bg-orange-900/20 border border-orange-500/30 hover:border-orange-500 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/10 to-orange-600/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiTruck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Emergency</p>
                <p className="text-xs text-orange-400 mt-1">Order Parts</p>
              </button>
              <div className="absolute -bottom-12 right-0 bg-sms-dark border border-orange-500/30 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-orange-400 font-semibold">Urgent Parts Request</p>
                <p className="text-xs text-gray-400">Fast-track critical spare parts delivery</p>
              </div>
            </div>

            {/* Equipment */}
            <div className="relative group">
              <button
                onClick={() => handleSectionClick('equipment')}
                className="relative overflow-hidden bg-sms-gray border border-gray-600 hover:border-sms-cyan rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-sms-cyan/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sms-cyan/0 via-sms-cyan/10 to-sms-cyan/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiGrid className="w-8 h-8 text-sms-cyan mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Equipment</p>
                <p className="text-xs text-gray-400 mt-1">Management</p>
              </button>
              <div className="absolute -bottom-12 right-0 bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-sms-cyan font-semibold">Equipment Database</p>
                <p className="text-xs text-gray-400">View all mechanical equipment</p>
              </div>
            </div>

            {/* Maintenance Calendar */}
            <div className="relative group">
              <button
                onClick={() => handleSectionClick('calendar')}
                className="relative overflow-hidden bg-sms-gray border border-gray-600 hover:border-blue-500 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <FiCalendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Maintenance</p>
                <p className="text-xs text-gray-400 mt-1">Calendar</p>
              </button>
              <div className="absolute -bottom-12 right-0 bg-sms-dark border border-gray-600 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none min-w-max">
                <p className="text-xs text-blue-400 font-semibold">PM Schedule</p>
                <p className="text-xs text-gray-400">View upcoming maintenance tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* HSE Updates and Private Chat in Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* HSE Updates - Left Side */}
          <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FiAlertOctagon className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">HSE Updates</h3>
                  <div className="space-y-3">
                    {hseUpdates.map((update) => (
                      <div key={update.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          update.type === 'drill' ? 'bg-blue-400' :
                          update.type === 'nearmiss' ? 'bg-amber-400' : 'bg-green-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white">{update.title}</h4>
                            <span className="text-xs text-gray-500">{update.date}</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{update.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/hse/updates')}
                className="text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap"
              >
                View All →
              </button>
            </div>
          </div>

          {/* Private Chat - Right Side */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiCpu className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Private Support Chat</h3>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Available 24/7</span>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Need to talk? Our confidential AI counselor is here to listen and support you with any personal or work-related concerns. Your conversations are completely private and never shared.
            </p>
            <ul className="space-y-2 mb-6 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Mental health & stress management</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Work-life balance challenges</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Family & relationship support</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Career guidance & development</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/ai-counselor')}
              className="w-full py-3 bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/40 hover:text-purple-200 transition-all flex items-center justify-center space-x-2"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span className="font-semibold">Start Private Chat</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              🔒 100% Confidential • No logs kept
            </p>
          </div>
        </div>

        {/* Maintenance Alerts & Active Faults */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Maintenance Alerts */}
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiCalendar className="w-6 h-6 text-sms-cyan" />
                <h3 className="text-lg font-semibold text-white">Maintenance Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/maintenance')}
                className="text-xs text-sms-cyan hover:text-white transition-colors"
              >
                View Calendar →
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Overdue */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                    <div>
                      <p className="text-sm font-semibold text-red-400">OVERDUE: Main Pump 1</p>
                      <p className="text-xs text-gray-400">Bearing inspection - 3 days overdue</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/equipment/main-pump-1')}
                    className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap"
                  >
                    Go to Equipment →
                  </button>
                </div>
              </div>
              
              {/* Due Soon */}
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">DUE SOON: Compressor 2</p>
                      <p className="text-xs text-gray-400">Valve service - Due in 2 days</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/equipment/compressor-2')}
                    className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap"
                  >
                    Go to Equipment →
                  </button>
                </div>
              </div>
              
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">DUE SOON: Engine 3</p>
                      <p className="text-xs text-gray-400">Oil change - Due in 5 days</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/equipment/engine-3')}
                    className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap"
                  >
                    Go to Equipment →
                  </button>
                </div>
              </div>
              
              {/* Upcoming */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-gray-400">
                  <FiCheckCircle className="w-4 h-4" />
                  <p className="text-xs">15 more maintenance tasks scheduled this month</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Faults */}
          <div className="bg-sms-dark border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiAlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">Active Faults</h3>
              </div>
              <button
                onClick={() => navigate('/records?filter=active')}
                className="text-xs text-orange-400 hover:text-white transition-colors"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Critical Fault */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 animate-pulse" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-red-400">CRITICAL: Hydraulic System Failure</p>
                        <span className="text-xs text-red-300 bg-red-900/50 px-2 py-0.5 rounded">2h 15m</span>
                      </div>
                      <p className="text-xs text-gray-400">Assigned: John Anderson • Status: Diagnostics in progress</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/fault/diagnostic')}
                    className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap"
                  >
                    Continue →
                  </button>
                </div>
              </div>
              
              {/* Minor Faults */}
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-amber-400">MINOR: Bearing Temperature High</p>
                        <span className="text-xs text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded">18h</span>
                      </div>
                      <p className="text-xs text-gray-400">Assigned: You • Status: Parts ordered</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/fault/complete')}
                    className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap"
                  >
                    Complete →
                  </button>
                </div>
              </div>
              
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-amber-400">MINOR: Oil Leak - Pump 2</p>
                        <span className="text-xs text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded">3d</span>
                      </div>
                      <p className="text-xs text-gray-400">Assigned: Maria G. • Status: Monitoring</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/equipment/pump-2')}
                    className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap"
                  >
                    View →
                  </button>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-400">1 Critical</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-gray-400">3 Minor</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Avg Resolution: 5.8h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - 2x2 Grid */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Equipment Management */}
              <div className="relative group">
                <div
                  onClick={() => handleSectionClick('equipment')}
                  className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02] sm:aspect-square min-h-[200px] flex flex-col justify-between"
                >
                  <div>
                    <FiGrid className="w-10 h-10 text-sms-cyan mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Equipment</h3>
                    <p className="text-gray-400 text-sm">Mechanical equipment</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">52 Units</span>
                    <span className="text-xs text-green-400">4 Due</span>
                  </div>
                </div>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-sms-dark border border-sms-cyan/30 rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <p className="text-sm text-sms-cyan font-semibold">Browse All Equipment</p>
                  <p className="text-xs text-gray-400">View specs, manuals, maintenance history</p>
                  <p className="text-xs text-gray-500 mt-1">Organized by: Pumps, Compressors, Engines, etc.</p>
                </div>
              </div>

              {/* Maintenance Calendar */}
              <div className="relative group">
                <div
                  onClick={() => handleSectionClick('maintenance')}
                  className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02] sm:aspect-square min-h-[200px] flex flex-col justify-between"
                >
                  <div>
                    <FiCalendar className="w-10 h-10 text-blue-400 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Maintenance Calendar</h3>
                    <p className="text-gray-400 text-sm">Maintenance schedule</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">Week: 10 Tasks</span>
                    <span className="text-xs text-amber-400">3 Overdue</span>
                  </div>
                </div>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-sms-dark border border-blue-500/30 rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <p className="text-sm text-blue-400 font-semibold">Planned Maintenance Schedule</p>
                  <p className="text-xs text-gray-400">View upcoming PMs, create work orders</p>
                  <p className="text-xs text-gray-500 mt-1">Synced with manufacturer recommendations</p>
                </div>
              </div>

              {/* Records */}
              <div className="relative group">
                <div
                  onClick={() => handleSectionClick('records')}
                  className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02] sm:aspect-square min-h-[200px] flex flex-col justify-between"
                >
                  <div>
                    <FiFileText className="w-10 h-10 text-purple-400 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Records</h3>
                    <p className="text-gray-400 text-sm">Fault history</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">923 Records</span>
                    <span className="text-xs text-gray-400">Updated Daily</span>
                  </div>
                </div>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-sms-dark border border-purple-500/30 rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <p className="text-sm text-purple-400 font-semibold">Historical Database</p>
                  <p className="text-xs text-gray-400">Search all past faults, repairs & reports</p>
                  <p className="text-xs text-gray-500 mt-1">Export ready for audits & analysis</p>
                </div>
              </div>

              {/* Inventory */}
              <div className="relative group">
                <div
                  onClick={() => handleSectionClick('inventory')}
                  className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 hover:border-sms-cyan rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/10 hover:scale-[1.02] sm:aspect-square min-h-[200px] flex flex-col justify-between"
                >
                  <div>
                    <FiPackage className="w-10 h-10 text-orange-400 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Inventory</h3>
                    <p className="text-gray-400 text-sm">Parts & consumables</p>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">385 Items</span>
                    <span className="text-xs text-red-400">7 Low Stock</span>
                  </div>
                </div>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-sms-dark border border-orange-500/30 rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <p className="text-sm text-orange-400 font-semibold">Spare Parts Tracking</p>
                  <p className="text-xs text-gray-400">Check stock levels, order parts, track usage</p>
                  <p className="text-xs text-gray-500 mt-1">Low stock alerts & reorder suggestions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - AI Work Assistant */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiCpu className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Work Assistant</h3>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 pr-2">
                {/* Equipment Insights */}
                <div className="bg-purple-800/20 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center space-x-2">
                    <FiAlertTriangle className="w-4 h-4" />
                    <span>Equipment Health Warnings</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400">•</span>
                      <span>Main Pump 1 showing early signs of bearing wear - schedule inspection within 2 weeks</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400">•</span>
                      <span>Compressor 2 vibration trending high - check alignment and mounting today</span>
                    </li>
                  </ul>
                </div>

                {/* Proactive Suggestions */}
                <div className="bg-purple-800/20 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center space-x-2">
                    <FiClock className="w-4 h-4" />
                    <span>Proactive Work Suggestions</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400">•</span>
                      <span>Complete engine oil analysis during downtime - estimated 30 mins</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400">•</span>
                      <span>Ideal time for hydraulic filter replacement based on runtime hours</span>
                    </li>
                  </ul>
                </div>

                {/* Parts Availability */}
                <div className="bg-purple-800/20 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center space-x-2">
                    <FiPackage className="w-4 h-4" />
                    <span>Parts Availability Alerts</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-400">•</span>
                      <span>Pump seal stock low (3 remaining) - reorder recommended</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400">•</span>
                      <span>All parts for upcoming PM tasks are available onboard</span>
                    </li>
                  </ul>
                </div>

                {/* Recent AI Insight */}
                <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-sm text-purple-200 italic">
                    "Based on fleet-wide data, equipment with your compressor model typically requires valve replacement at 12,000 hours. Your unit is at 11,750."
                  </p>
                  <p className="text-xs text-purple-400 mt-2">- Predictive maintenance insight</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/ai-assistant')}
              className="w-full py-3 bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/40 hover:text-purple-200 transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span className="font-semibold">Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Community Board */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FiUsers className="w-6 h-6 text-sms-cyan" />
              <h2 className="text-lg font-semibold text-white">Fleet Community Board</h2>
              <span className="text-xs bg-sms-cyan/20 text-sms-cyan px-2 py-1 rounded-full">8 New</span>
            </div>
            <div className="relative group">
              <button
                onClick={() => navigate('/community/new-post')}
                className="flex items-center space-x-2 px-4 py-2 bg-sms-cyan/20 border border-sms-cyan/30 rounded-lg hover:bg-sms-cyan/30 transition-all"
              >
                <FiPlus className="w-4 h-4 text-sms-cyan" />
                <span className="text-sm text-sms-cyan">New Post</span>
              </button>
              <div className="absolute -bottom-14 right-0 bg-sms-dark border border-sms-cyan/30 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                <p className="text-xs text-sms-cyan font-semibold">Share Knowledge</p>
                <p className="text-xs text-gray-400">Ask questions or share tips with fleet</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {communityPosts.map((post) => (
              <div key={post.id} className="bg-sms-gray/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all">
                <div className="flex items-start space-x-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sms-cyan to-blue-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-sms-dark flex items-center justify-center">
                        <span className="text-white font-semibold">{post.author.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
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

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-sms-dark/60 text-sms-cyan px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-6 mt-4">
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-sms-cyan transition-colors">
                        <FiHeart className="w-4 h-4" />
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
            onClick={() => navigate('/community')}
            className="w-full mt-4 py-3 text-center text-sm text-sms-cyan hover:text-white border border-gray-700 hover:border-sms-cyan rounded-lg transition-all"
          >
            View All Community Posts →
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
                      Extensions should be coordinated with your supervisor and relief technician.
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
                      All handover items are complete. You may depart early if needed.
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

export default MechanicDashboard;