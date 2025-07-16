import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiMessageSquare, FiFileText, FiClock, FiTool, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DiagnosticTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const FaultDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { equipment, area, faultType } = location.state || {};
  
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showSchematic, setShowSchematic] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Start timer if critical fault
  useEffect(() => {
    if (faultType === 'critical') {
      const interval = setInterval(() => {
        const startTime = sessionStorage.getItem('critical_fault_start');
        if (startTime) {
          const elapsed = Date.now() - new Date(startTime).getTime();
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          // Silent timer - data collected but not shown to technician
          console.log(`MTTR Timer: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [faultType]);

  const diagnosticTools: DiagnosticTool[] = [
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      icon: <FiMessageSquare className="w-6 h-6" />,
      description: 'Get intelligent troubleshooting help',
      color: 'purple'
    },
    {
      id: 'schematics',
      name: 'Schematics',
      icon: <FiFileText className="w-6 h-6" />,
      description: 'View electrical drawings & diagrams',
      color: 'blue'
    },
    {
      id: 'manuals',
      name: 'Tech Manuals',
      icon: <FiFileText className="w-6 h-6" />,
      description: 'Equipment manuals & procedures',
      color: 'green'
    },
    {
      id: 'history',
      name: 'Fault History',
      icon: <FiClock className="w-6 h-6" />,
      description: 'Previous issues & solutions',
      color: 'amber'
    },
    {
      id: 'parts',
      name: 'Parts Inventory',
      icon: <FiPackage className="w-6 h-6" />,
      description: 'Check spare parts availability',
      color: 'orange'
    },
    {
      id: 'tools',
      name: 'Tool Checklist',
      icon: <FiTool className="w-6 h-6" />,
      description: 'Required tools for repair',
      color: 'gray'
    }
  ];

  const handleToolClick = (toolId: string) => {
    if (activeTools.includes(toolId)) {
      setActiveTools(activeTools.filter(id => id !== toolId));
    } else {
      setActiveTools([...activeTools, toolId]);
      
      // Initialize AI chat with equipment context
      if (toolId === 'ai-assistant' && chatMessages.length === 0) {
        setChatMessages([
          {
            role: 'assistant',
            content: `I see you're working on ${equipment?.name} in the ${area?.name} area. Based on fleet data, I've found similar issues reported on 3 other vessels. What specific problem are you experiencing?`
          }
        ]);
      }
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setChatInput('');

    // Simulate AI response based on input
    setTimeout(() => {
      let response = '';
      if (userMessage.toLowerCase().includes('not starting') || userMessage.toLowerCase().includes('won\'t start')) {
        response = `For ${equipment?.name} not starting, here's the recommended troubleshooting sequence:\n\n1. Check control power at ${equipment?.model} panel - should read 24VDC\n2. Verify E-stop circuit continuity\n3. Check starter contactor coil resistance (should be 45-55Ω)\n\nFleet data shows 85% of these faults were resolved by replacing the control relay (Part #CR-2745). We have 3 in stock.`;
      } else if (userMessage.toLowerCase().includes('overload') || userMessage.toLowerCase().includes('trip')) {
        response = `Overload tripping on ${equipment?.name} typically indicates:\n\n1. Check motor insulation resistance (minimum 1MΩ)\n2. Verify load current vs nameplate rating\n3. Inspect motor bearings for excessive heat\n\nTechnician Mike Chen on MV Northern Pioneer resolved similar issue last month by replacing worn bearings. Would you like to see his repair notes?`;
      } else {
        response = `Based on fleet-wide data for ${equipment?.model} units, I recommend checking the most common failure points:\n\n1. Control circuit fuses\n2. Motor insulation\n3. Starter contacts\n4. Control relay operation\n\nWould you like me to guide you through any specific test?`;
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  const handleComplete = () => {
    navigate('/fault/complete', {
      state: {
        equipment,
        area,
        faultType,
        toolsUsed: activeTools,
        startTime: sessionStorage.getItem('critical_fault_start')
      }
    });
  };

  const faultHistory = [
    {
      id: 1,
      date: '2024-11-15',
      vessel: 'MV Atlantic Guardian',
      issue: 'Motor failed to start - Control relay fault',
      resolution: 'Replaced control relay CR-2745',
      downtime: '2.5 hours',
      tech: 'S. Williams'
    },
    {
      id: 2,
      date: '2024-10-22',
      vessel: 'MV Northern Pioneer',
      issue: 'Overload tripping during operation',
      resolution: 'Replaced motor bearings, realigned coupling',
      downtime: '4 hours',
      tech: 'M. Chen'
    },
    {
      id: 3,
      date: '2024-09-30',
      vessel: 'MV Pacific Explorer',
      issue: 'Intermittent control power loss',
      resolution: 'Tightened loose terminal connections',
      downtime: '45 minutes',
      tech: 'T. Rodriguez'
    }
  ];

  const partsInventory = [
    { partNo: 'CR-2745', name: 'Control Relay 24VDC', stock: 3, location: 'E-Store Cab 3' },
    { partNo: 'MC-450A', name: 'Main Contactor 450A', stock: 1, location: 'E-Store Cab 5' },
    { partNo: 'OL-350', name: 'Overload Relay', stock: 2, location: 'E-Store Cab 3' },
    { partNo: 'BRG-6205', name: 'Motor Bearing 6205', stock: 4, location: 'Mech Store' },
    { partNo: 'FS-30A', name: 'Control Fuse 30A', stock: 12, location: 'E-Store Cab 1' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray">
      {/* Header */}
      <div className={`${faultType === 'critical' ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'} border-b`}>
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
              <div>
                <h1 className="text-xl font-bold text-white">Diagnostic Tools</h1>
                <p className="text-sm text-gray-400">{equipment?.name} • {area?.name}</p>
              </div>
            </div>
            {faultType === 'critical' && (
              <div className="bg-red-900/30 px-4 py-2 rounded-lg border border-red-500/30">
                <p className="text-sm text-red-400">Critical Fault</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tools Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Available Tools</h2>
            <div className="space-y-3">
              {diagnosticTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`w-full p-4 rounded-xl border transition-all duration-300 ${
                    activeTools.includes(tool.id)
                      ? 'bg-sms-dark border-sms-cyan shadow-lg shadow-sms-cyan/20'
                      : 'bg-sms-dark/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-${tool.color}-400`}>{tool.icon}</div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                      <p className="text-xs text-gray-400">{tool.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Complete Repair Button */}
            <button
              onClick={handleComplete}
              className="w-full mt-6 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-400 font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>Complete Repair</span>
            </button>
          </div>

          {/* Active Tool Content */}
          <div className="lg:col-span-2">
            {activeTools.includes('ai-assistant') && (
              <div className="bg-sms-dark rounded-xl border border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FiMessageSquare className="w-5 h-5 text-purple-400" />
                  <span>AI Troubleshooting Assistant</span>
                </h3>
                
                {/* Chat Messages */}
                <div className="bg-sms-gray/50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-xs lg:max-w-md p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-600/20 text-white' 
                          : 'bg-purple-600/20 text-purple-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Describe the issue..."
                    className="flex-1 px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {activeTools.includes('schematics') && (
              <div className="bg-sms-dark rounded-xl border border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FiFileText className="w-5 h-5 text-blue-400" />
                  <span>Electrical Schematics</span>
                </h3>
                
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search components (e.g., 'starter', 'motor', 'relay')"
                    className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-sms-gray/50 rounded-lg p-4 h-64 flex items-center justify-center">
                  <p className="text-gray-400">
                    {searchTerm 
                      ? `Highlighting "${searchTerm}" in ${equipment?.name} schematics...`
                      : `${equipment?.name} electrical schematic would display here`
                    }
                  </p>
                </div>
              </div>
            )}

            {activeTools.includes('history') && (
              <div className="bg-sms-dark rounded-xl border border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-amber-400" />
                  <span>Fault History - {equipment?.model}</span>
                </h3>
                
                <div className="space-y-3">
                  {faultHistory.map((fault) => (
                    <div key={fault.id} className="bg-sms-gray/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{fault.issue}</p>
                          <p className="text-xs text-gray-400">{fault.vessel} • {fault.date}</p>
                        </div>
                        <span className="text-xs text-red-400">{fault.downtime}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">Fix: {fault.resolution}</p>
                      <p className="text-xs text-gray-500">Tech: {fault.tech}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTools.includes('parts') && (
              <div className="bg-sms-dark rounded-xl border border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FiPackage className="w-5 h-5 text-orange-400" />
                  <span>Parts Inventory</span>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-700">
                        <th className="pb-2 text-sm font-semibold text-gray-400">Part No.</th>
                        <th className="pb-2 text-sm font-semibold text-gray-400">Description</th>
                        <th className="pb-2 text-sm font-semibold text-gray-400">Stock</th>
                        <th className="pb-2 text-sm font-semibold text-gray-400">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsInventory.map((part) => (
                        <tr key={part.partNo} className="border-b border-gray-800">
                          <td className="py-3 text-sm text-white">{part.partNo}</td>
                          <td className="py-3 text-sm text-gray-300">{part.name}</td>
                          <td className="py-3">
                            <span className={`text-sm font-semibold ${
                              part.stock > 2 ? 'text-green-400' : 
                              part.stock > 0 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {part.stock}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-400">{part.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultDiagnostic;