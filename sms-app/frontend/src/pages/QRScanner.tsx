import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../styles/animations.css';

interface DemoQRCode {
  id: string;
  equipmentId: string;
  equipmentName: string;
  area: string;
  status: 'operational' | 'warning' | 'critical';
  lastMaintenance: string;
}

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Demo QR codes for different equipment
  const demoQRCodes: DemoQRCode[] = [
    {
      id: 'qr-001',
      equipmentId: 'hpu-1-motor',
      equipmentName: 'HPU 1 Motor',
      area: 'HPU',
      status: 'operational',
      lastMaintenance: '2024-11-15'
    },
    {
      id: 'qr-002',
      equipmentId: 'mud-pump-1',
      equipmentName: 'Mud Pump 1',
      area: 'Mud System',
      status: 'warning',
      lastMaintenance: '2024-10-20'
    },
    {
      id: 'qr-003',
      equipmentId: 'gen-1',
      equipmentName: 'Generator 1',
      area: 'Generators',
      status: 'operational',
      lastMaintenance: '2024-11-01'
    },
    {
      id: 'qr-004',
      equipmentId: 'thruster-1',
      equipmentName: 'Bow Thruster 1',
      area: 'Thruster Systems',
      status: 'critical',
      lastMaintenance: '2024-09-15'
    },
    {
      id: 'qr-005',
      equipmentId: 'drawworks-motor',
      equipmentName: 'Drawworks Motor',
      area: 'Doghouse',
      status: 'operational',
      lastMaintenance: '2024-11-10'
    },
    {
      id: 'qr-006',
      equipmentId: 'scr-house-main',
      equipmentName: 'SCR House Main',
      area: 'Doghouse',
      status: 'warning',
      lastMaintenance: '2024-10-05'
    }
  ];

  const handleScanQR = (qrCode: DemoQRCode) => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      setShowSuccess(true);
      
      // Show success message
      toast.success(`Equipment identified: ${qrCode.equipmentName}`, {
        duration: 2000
      });
      
      // Navigate to equipment detail after short delay
      setTimeout(() => {
        navigate(`/equipment/${qrCode.equipmentId}`, {
          state: {
            id: qrCode.equipmentId,
            name: qrCode.equipmentName,
            area: qrCode.area,
            status: qrCode.status,
            lastMaintenance: qrCode.lastMaintenance
          }
        });
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className="bg-sms-dark/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/technician')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiCamera className="w-6 h-6 text-sms-cyan" />
                <h1 className="text-xl font-bold text-white">Equipment QR Scanner</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Viewfinder */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Camera View</h2>
            
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingTop: '100%' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-3 grid-rows-3 h-full">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-gray-700"></div>
                    ))}
                  </div>
                </div>
                
                {/* Scanning animation */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-sms-cyan rounded-lg animate-pulse"></div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sms-cyan to-transparent animate-scan"></div>
                  </>
                )}
                
                {/* Success indicator */}
                {showSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-green-500/20 rounded-full p-8 animate-ping-once">
                      <FiCheckCircle className="w-16 h-16 text-green-400" />
                    </div>
                  </div>
                )}
                
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-sms-cyan"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-sms-cyan"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-sms-cyan"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-sms-cyan"></div>
                
                {/* Instruction text */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <p className="text-sms-cyan text-sm font-semibold">
                    {isScanning ? 'Scanning...' : 'Point camera at equipment QR code'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                Camera simulation for demo - Click a QR code on the right to scan
              </p>
            </div>
          </div>

          {/* Demo QR Codes */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Demo Equipment QR Codes</h2>
            <p className="text-sm text-gray-400 mb-6">
              Click any QR code below to simulate scanning equipment
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {demoQRCodes.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => handleScanQR(qr)}
                  disabled={isScanning}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-sms-cyan transition-all duration-300 hover:shadow-lg hover:shadow-sms-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 bg-white rounded-lg p-2 group-hover:scale-105 transition-transform">
                      {/* QR Code pattern */}
                      <div className="w-full h-full bg-black rounded grid grid-cols-5 grid-rows-5 gap-0.5 p-1">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className={`${
                              [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) ||
                              (i % 7 === 0)
                                ? 'bg-black'
                                : 'bg-white'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      qr.status === 'operational' 
                        ? 'bg-green-900/30 text-green-400' 
                        : qr.status === 'warning'
                        ? 'bg-amber-900/30 text-amber-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {qr.status === 'operational' ? <FiCheckCircle className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-white group-hover:text-sms-cyan transition-colors">
                      {qr.equipmentName}
                    </h3>
                    <p className="text-xs text-gray-400">{qr.area}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {qr.equipmentId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="mt-6 bg-sms-dark rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Scans</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">No recent scans in this session</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default QRScanner;