import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiAnchor, FiLogOut, FiCalendar, FiClock, FiInfo } from 'react-icons/fi';
import { companyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VesselSyncLoader from '../components/VesselSyncLoader';
import SMSLoadingScreen from '../components/SMSLoadingScreen';
import toast from 'react-hot-toast';

interface RotationDetails {
  startDate: string;
  endDate: string;
  shift: 'day' | 'night' | 'swing';
  rotationLength: number;
}

const VesselSelect: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [selectedVesselData, setSelectedVesselData] = useState<any>(null);
  const [showRotationSetup, setShowRotationSetup] = useState(false);
  const [rotationDetails, setRotationDetails] = useState<RotationDetails>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    shift: 'day',
    rotationLength: 28
  });

  // Fetch vessels for the user's company
  const { data: vessels = [], isLoading, error } = useQuery({
    queryKey: ['vessels', user?.company.id],
    queryFn: () => companyAPI.getVessels(user!.company.id),
    select: (response) => response.data,
    enabled: !!user?.company.id,
    retry: 1,
  });

  // Handle errors
  React.useEffect(() => {
    if (error) {
      console.error('Failed to fetch vessels:', error);
      if ((error as any).response?.status === 404) {
        // Clear old auth data and force re-login
        logout();
      }
    }
  }, [error, logout]);

  const handleVesselSelect = (vessel: any) => {
    setSelectedVessel(vessel.id);
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
      vesselId: selectedVessel,
      ...rotationDetails,
      joinedAt: new Date().toISOString()
    }));
    
    localStorage.setItem('sms_selected_vessel', selectedVessel!.toString());
    
    // Check if first time on this vessel
    const vesselHistory = JSON.parse(localStorage.getItem('sms_vessel_history') || '{}');
    const isFirstTime = !vesselHistory[selectedVessel!];
    
    if (isFirstTime) {
      // Mark vessel as visited
      vesselHistory[selectedVessel!] = true;
      localStorage.setItem('sms_vessel_history', JSON.stringify(vesselHistory));
      
      // Navigate to vessel introduction
      navigate('/vessel-introduction', { 
        state: { vessel: selectedVesselData, rotation: rotationDetails } 
      });
    } else {
      setShowSync(true);
    }
  };

  const handleSyncComplete = () => {
    // Navigate based on user's dashboard URL from backend
    if (user?.dashboardUrl) {
      navigate(user.dashboardUrl);
    } else {
      // Fallback to role-based routing
      const roleRoutes: Record<string, string> = {
        technician: '/dashboard/technician',
        manager: '/dashboard/manager',
        admin: '/dashboard/internal',
      };
      
      navigate(roleRoutes[user!.role] || '/dashboard/technician');
    }
  };

  if (isLoading) {
    return <SMSLoadingScreen message="Loading vessels..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sms-dark">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to load vessels</h2>
          <p className="text-gray-400 mb-4">Please try logging in again</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-sms-cyan text-white rounded-lg hover:bg-sms-cyan/80 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

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
              <p className="text-gray-400">Welcome, {user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <button
            onClick={logout}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vessels.map((vessel: any) => (
              <div
                key={vessel.id}
                onClick={() => handleVesselSelect(vessel)}
                className={`relative overflow-hidden rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-sms-cyan/20 ${
                  selectedVessel === vessel.id ? 'ring-2 ring-sms-cyan shadow-lg shadow-sms-cyan/30' : ''
                }`}
                style={{
                  background: vessel.image_url?.includes('.svg') 
                    ? `linear-gradient(135deg, rgba(0,51,102,0.9) 0%, rgba(26,26,46,0.9) 100%), url(${vessel.image_url})`
                    : `linear-gradient(135deg, rgba(0,51,102,0.9) 0%, rgba(26,26,46,0.9) 100%), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23003366" width="1200" height="600"/><path fill="%23004488" d="M0 300L50 325L100 300L150 275L200 300L250 325L300 300L350 275L400 300L450 325L500 300L550 275L600 300L650 325L700 300L750 275L800 300L850 325L900 300L950 275L1000 300L1050 325L1100 300L1150 275L1200 300V600H0V300Z"/></svg>')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '250px',
                }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-sms-cyan/50"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-sms-cyan/50"></div>
                
                {/* Content */}
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

                {/* Selection indicator */}
                {selectedVessel === vessel.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-sms-cyan rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* If no vessels */}
          {vessels.length === 0 && (
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
                <div className="space-y-3">
                  {/* Preset options */}
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
                  {/* Custom option */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">Or custom:</span>
                    <input
                      type="number"
                      min="7"
                      max="180"
                      value={[14, 21, 28, 35].includes(rotationDetails.rotationLength) ? '' : rotationDetails.rotationLength}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 28;
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
                      placeholder="Enter days"
                      className="w-32 px-3 py-2 bg-sms-dark border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-sms-cyan"
                    />
                    <span className="text-sm text-gray-400">days</span>
                  </div>
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

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date (Handover Due)
                </label>
                <input
                  type="date"
                  value={rotationDetails.endDate}
                  onChange={(e) => {
                    setRotationDetails(prev => {
                      const startDate = new Date(prev.startDate);
                      const endDate = new Date(e.target.value);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return {
                        ...prev,
                        endDate: e.target.value,
                        rotationLength: diffDays
                      };
                    });
                  }}
                  min={rotationDetails.startDate}
                  className="w-full px-4 py-3 bg-sms-dark border border-gray-600 rounded-lg text-white focus:outline-none focus:border-sms-cyan"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated or manually adjust</p>
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
                  <FiInfo className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-semibold text-sm">Important: Handover Required</p>
                    <p className="text-gray-300 text-sm mt-1">
                      You must complete a full handover before your rotation ends on {rotationDetails.endDate || 'selected date'}. 
                      The system will lock vessel disembarkation until handover is submitted.
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
};

export default VesselSelect;