import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiAnchor, FiAlertCircle, FiTool, FiCalendar, FiUsers, FiChevronRight, FiMapPin, FiCpu, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const VesselIntroduction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const vessel = location.state?.vessel;
  const rotation = location.state?.rotation;

  if (!vessel) {
    navigate('/vessels');
    return null;
  }

  const slides = [
    {
      title: 'Welcome to',
      content: (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">{vessel.name}</h1>
          <p className="text-xl text-sms-cyan mb-2">{vessel.vessel_type}</p>
          <p className="text-gray-400">IMO: {vessel.imo_number}</p>
          <div className="mt-8 p-6 bg-sms-dark/60 rounded-xl">
            <p className="text-gray-300 mb-2">Your Rotation: <span className="text-white font-semibold">{rotation.rotationLength} days</span></p>
            <p className="text-gray-300">Shift Pattern: <span className="text-white font-semibold capitalize">{rotation.shift === 'swing' ? '12hr Swing' : `${rotation.shift} Shift`}</span></p>
          </div>
        </div>
      ),
      icon: <FiAnchor className="w-16 h-16 text-sms-cyan mx-auto mb-6" />
    },
    {
      title: 'Your Equipment Responsibility',
      content: (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h3 className="text-sms-cyan font-semibold mb-2">Drilling Systems</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Top Drive System (VFD)</li>
                <li>• Draw Works & Motors</li>
                <li>• Rotary Table Drive</li>
                <li>• Mud Pump VFDs (3x)</li>
              </ul>
            </div>
            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h3 className="text-sms-cyan font-semibold mb-2">Power & Control</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• SCR House Equipment</li>
                <li>• MCC Panels (6x)</li>
                <li>• Emergency Generator</li>
                <li>• UPS Systems</li>
              </ul>
            </div>
          </div>
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-400 font-semibold">Total Equipment Count: 47 Units</p>
            <p className="text-sm text-gray-300 mt-1">All equipment QR codes are located on the main electrical panel of each unit</p>
          </div>
        </div>
      ),
      icon: <FiTool className="w-16 h-16 text-orange-400 mx-auto mb-6" />
    },
    {
      title: 'Current Issues & Priorities',
      content: (
        <div>
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-semibold">Critical: Top Drive VFD Fault</h4>
                  <p className="text-sm text-gray-300 mt-1">Intermittent DC bus overvoltage. Parts on order. Temporary fix: Reduce accel time to 15s.</p>
                  <p className="text-xs text-gray-500 mt-2">Reported by: Tom Rodriguez • 3 days ago</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-400 font-semibold">Minor: Mud Pump #2 Vibration</h4>
                  <p className="text-sm text-gray-300 mt-1">Slight vibration at 80%+ load. Monitor daily. Bearing replacement scheduled next port call.</p>
                  <p className="text-xs text-gray-500 mt-2">Reported by: Previous Tech • 1 week ago</p>
                </div>
              </div>
            </div>

            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h4 className="text-gray-300 font-semibold mb-2">Recurring Issues to Watch:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• SCR ground faults during heavy rain (check enclosure seals)</li>
                <li>• Draw works brake resistor overheating (clean cooling fins weekly)</li>
                <li>• MCC-3 phase imbalance alarm (usually false, reset required)</li>
              </ul>
            </div>
          </div>
        </div>
      ),
      icon: <FiAlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
    },
    {
      title: 'Maintenance Schedule',
      content: (
        <div>
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">Upcoming This Rotation:</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-sms-dark/60 rounded-lg">
                <div>
                  <p className="text-white">VFD Cooling Fan Filters</p>
                  <p className="text-sm text-gray-400">All units - Monthly clean</p>
                </div>
                <span className="text-sm text-amber-400">Due in 3 days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-sms-dark/60 rounded-lg">
                <div>
                  <p className="text-white">Emergency Generator Test</p>
                  <p className="text-sm text-gray-400">Weekly auto-start verification</p>
                </div>
                <span className="text-sm text-green-400">Every Monday</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-sms-dark/60 rounded-lg">
                <div>
                  <p className="text-white">IR Scanning - Electrical Panels</p>
                  <p className="text-sm text-gray-400">Quarterly thermal inspection</p>
                </div>
                <span className="text-sm text-blue-400">Due in 14 days</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              <span className="font-semibold">Tip:</span> All maintenance schedules sync with the calendar. Completed tasks auto-generate reports.
            </p>
          </div>
        </div>
      ),
      icon: <FiCalendar className="w-16 h-16 text-blue-400 mx-auto mb-6" />
    },
    {
      title: 'Key Contacts & Support',
      content: (
        <div>
          <div className="space-y-4">
            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Previous Rotation Tech:</h4>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sms-cyan to-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold">TR</span>
                </div>
                <div>
                  <p className="text-white">Tom Rodriguez</p>
                  <p className="text-sm text-gray-400">Left detailed handover notes</p>
                  <p className="text-xs text-sms-cyan mt-1">Available on Teams until Thursday</p>
                </div>
              </div>
            </div>

            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Fleet Electrical Support:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">MV Atlantic Guardian</p>
                  <p className="text-white">Sarah Williams</p>
                  <p className="text-xs text-gray-500">Senior Electrician</p>
                </div>
                <div>
                  <p className="text-gray-400">MV Northern Pioneer</p>
                  <p className="text-white">Mike Chen</p>
                  <p className="text-xs text-gray-500">Lead Electrician</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FiCpu className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-purple-400 font-semibold">AI Assistant Available 24/7</p>
                  <p className="text-sm text-gray-300">Trained on this vessel's equipment history and manuals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: <FiUsers className="w-16 h-16 text-green-400 mx-auto mb-6" />
    },
    {
      title: 'Vessel-Specific Tips',
      content: (
        <div>
          <div className="space-y-4">
            <div className="bg-sms-dark/60 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiMapPin className="w-5 h-5 text-sms-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Equipment Locations</h4>
                  <p className="text-sm text-gray-300 mt-1">SCR room access through Deck 3, Port side. Key code: 4729#</p>
                </div>
              </div>
            </div>

            <div className="bg-sms-dark/60 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Vessel Quirks:</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• MCC-2 door sticks - lift slightly while opening</li>
                <li>• Top drive e-stop resets at local panel only</li>
                <li>• Mud pump VFDs need 30s between stop/start</li>
                <li>• Emergency gen coolant heater trips in rough seas (normal)</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-1">Pro Tip from Previous Tech:</p>
              <p className="text-sm text-gray-300">
                "Check SCR thyristor temps every morning shift. Cooling water flow meter is unreliable - use IR gun instead."
              </p>
            </div>
          </div>
        </div>
      ),
      icon: <FiTool className="w-16 h-16 text-purple-400 mx-auto mb-6" />
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Complete introduction - navigate to user's dashboard
      if (user?.dashboardUrl) {
        navigate(user.dashboardUrl);
      } else {
        // Fallback based on role
        const roleRoutes: Record<string, string> = {
          technician: '/dashboard/technician',
          manager: '/dashboard/manager',
          admin: '/dashboard/internal',
        };
        navigate(roleRoutes[user?.role || 'technician']);
      }
    }
  };

  const handleSkip = () => {
    // Navigate to user's dashboard
    if (user?.dashboardUrl) {
      navigate(user.dashboardUrl);
    } else {
      // Fallback based on role
      const roleRoutes: Record<string, string> = {
        technician: '/dashboard/technician',
        manager: '/dashboard/manager',
        admin: '/dashboard/internal',
      };
      navigate(roleRoutes[user?.role || 'technician']);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-sms-gray/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-sms-cyan'
                      : index < currentSlide
                      ? 'w-2 bg-sms-cyan/50'
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip Introduction
            </button>
          </div>

          {/* Slide Content */}
          <div className="mb-8">
            {slides[currentSlide].icon}
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {slides[currentSlide].title}
            </h2>
            <div className="min-h-[300px]">
              {slides[currentSlide].content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              className={`px-6 py-3 rounded-lg transition-all ${
                currentSlide === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-sms-dark border border-gray-600 text-gray-300 hover:bg-sms-dark/80'
              }`}
              disabled={currentSlide === 0}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sms-cyan to-blue-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-sms-cyan/30 transition-all"
            >
              <span>{currentSlide === slides.length - 1 ? 'Start Work' : 'Next'}</span>
              <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          First time on {vessel.name} • Introduction {currentSlide + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
};

export default VesselIntroduction;