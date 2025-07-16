import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiTruck, FiArrowLeft, FiAlertTriangle, FiUpload, FiX, FiPhone, FiMail, FiClock, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface OrderForm {
  location: string;
  equipment: string;
  partNumber: string;
  serialNumber: string;
  quantity: number;
  downtimeImpact: 'yes' | 'no' | '';
  description: string;
}

const EmergencyOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<OrderForm>({
    location: '',
    equipment: '',
    partNumber: '',
    serialNumber: '',
    quantity: 1,
    downtimeImpact: '',
    description: ''
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Equipment by location
  const equipmentByLocation: Record<string, Array<{ id: string; name: string }>> = {
    hpu: [
      { id: 'hpu-1-starter', name: 'HPU 1 Starter Panel' },
      { id: 'hpu-2-starter', name: 'HPU 2 Starter Panel' },
      { id: 'hpu-1-motor', name: 'HPU 1 Motor' },
      { id: 'hpu-2-motor', name: 'HPU 2 Motor' },
      { id: 'oil-conditioning', name: 'Oil Conditioning Panel' }
    ],
    doghouse: [
      { id: 'driller-console', name: 'Driller Console' },
      { id: 'scr-panel', name: 'SCR Control Panel' },
      { id: 'bop-control', name: 'BOP Control Panel' },
      { id: 'drawworks-control', name: 'Drawworks Control' }
    ],
    'mud-system': [
      { id: 'mud-pump-1', name: 'Mud Pump 1' },
      { id: 'mud-pump-2', name: 'Mud Pump 2' },
      { id: 'shale-shaker-1', name: 'Shale Shaker 1' },
      { id: 'desander', name: 'Desander Unit' },
      { id: 'desilter', name: 'Desilter Unit' }
    ],
    generators: [
      { id: 'gen-1', name: 'Generator 1' },
      { id: 'gen-2', name: 'Generator 2' },
      { id: 'gen-3', name: 'Generator 3' },
      { id: 'emergency-gen', name: 'Emergency Generator' }
    ],
    'crane-systems': [
      { id: 'main-crane', name: 'Main Crane' },
      { id: 'aux-crane', name: 'Auxiliary Crane' },
      { id: 'knuckle-boom', name: 'Knuckle Boom Crane' }
    ],
    'thruster-systems': [
      { id: 'thruster-1', name: 'Bow Thruster 1' },
      { id: 'thruster-2', name: 'Bow Thruster 2' },
      { id: 'thruster-3', name: 'Stern Thruster 1' },
      { id: 'thruster-4', name: 'Stern Thruster 2' }
    ]
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset equipment when location changes
      ...(name === 'location' && { equipment: '' })
    }));
  };

  const handleRadioChange = (value: 'yes' | 'no') => {
    setFormData(prev => ({
      ...prev,
      downtimeImpact: value
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    setUploadedPhotos(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate order number
    const orderNum = `EMG-${Date.now().toString().slice(-8)}`;
    setOrderNumber(orderNum);
    
    // Show notifications
    toast.success('Emergency order submitted successfully!', { duration: 3000 });
    
    setTimeout(() => {
      toast('🚨 Management and shore team have been notified', {
        duration: 4000,
        style: {
          background: '#7f1d1d',
          color: '#fecaca',
          border: '1px solid #ef4444'
        }
      });
    }, 1000);
    
    // Show confirmation
    setShowConfirmation(true);
  };

  const vesselName = localStorage.getItem('sms_selected_vessel') || 'MV Pacific Explorer';

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 to-orange-950 flex items-center justify-center p-4">
        <div className="bg-sms-dark rounded-xl border border-orange-500/30 p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Emergency Order Confirmed</h2>
            <p className="text-lg text-orange-400 font-mono">Order #{orderNumber}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Order Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Equipment:</span>
                <span className="text-white">{formData.equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Part Number:</span>
                <span className="text-white font-mono">{formData.partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white">{formData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Downtime Impact:</span>
                <span className={formData.downtimeImpact === 'yes' ? 'text-red-400' : 'text-green-400'}>
                  {formData.downtimeImpact === 'yes' ? 'Yes - Critical' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <FiClock className="w-6 h-6 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Estimated Delivery</h3>
            </div>
            <p className="text-2xl font-bold text-orange-400 mb-2">24-48 Hours</p>
            <p className="text-sm text-gray-400">
              Emergency procurement team is sourcing from nearest suppliers
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiPhone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">24/7 Emergency Hotline</p>
                  <p className="text-white font-semibold">+1 (800) 555-EMRG</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Shore Support Email</p>
                  <p className="text-white">emergency@oceanicmarine.com</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/technician')}
            className="w-full py-3 px-4 bg-sms-cyan text-white font-semibold rounded-lg hover:bg-sms-cyan/80 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-orange-950">
      {/* Header */}
      <div className="bg-red-900/30 border-b border-red-500/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
                <FiTruck className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-bold text-white">Emergency Parts Order</h1>
              </div>
            </div>
            <div className="bg-red-900/50 px-4 py-2 rounded-lg border border-red-500/50">
              <p className="text-sm text-red-400 font-semibold">URGENT REQUEST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Warning Banner */}
        <div className="mb-6 bg-orange-900/30 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-orange-400 mb-1">Emergency Order Guidelines</h3>
              <p className="text-sm text-gray-300">
                Use this form only for critical parts that will cause equipment downtime. 
                Misuse of emergency orders may result in additional charges. 
                Standard parts should be ordered through normal procurement channels.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vessel</label>
                <p className="text-white">{vesselName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Technician</label>
                <p className="text-white">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time</label>
                <p className="text-white">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                <p className="text-red-400 font-semibold">Emergency</p>
              </div>
            </div>
          </div>

          {/* Equipment Selection */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Equipment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Location <span className="text-red-400">*</span>
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select location...</option>
                  <option value="hpu">HPU</option>
                  <option value="doghouse">Doghouse</option>
                  <option value="mud-system">Mud System</option>
                  <option value="generators">Generators</option>
                  <option value="crane-systems">Crane Systems</option>
                  <option value="thruster-systems">Thruster Systems</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Equipment <span className="text-red-400">*</span>
                </label>
                <select
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.location}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                >
                  <option value="">Select equipment...</option>
                  {formData.location && equipmentByLocation[formData.location]?.map(eq => (
                    <option key={eq.id} value={eq.name}>{eq.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Part Details */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Part Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Part Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter serial number (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Downtime Impact <span className="text-red-400">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="downtimeImpact"
                      value="yes"
                      checked={formData.downtimeImpact === 'yes'}
                      onChange={() => handleRadioChange('yes')}
                      required
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="downtimeImpact"
                      value="no"
                      checked={formData.downtimeImpact === 'no'}
                      onChange={() => handleRadioChange('no')}
                      required
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white">No</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-sms-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="Describe the urgency and impact of not having this part..."
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-sms-dark rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Photo Upload</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">
                  Drop photos here or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Upload up to 5 photos of the damaged part or equipment
                </p>
              </label>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
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
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2"
            >
              <FiAlertTriangle className="w-5 h-5" />
              <span>Submit Emergency Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyOrder;