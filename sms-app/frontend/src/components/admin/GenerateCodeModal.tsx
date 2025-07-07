import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiCalendar, FiSave } from 'react-icons/fi';
import api from '../../services/api';

interface Company {
  id: number;
  name: string;
  contact_email?: string;
}

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateCodeModal: React.FC<GenerateCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [expiryDays, setExpiryDays] = useState(30);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      alert('Please select a company');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/activation/codes/generate', {
        companyId: selectedCompany,
        expiryDays,
        sendEmail
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate activation code');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setExpiryDays(30);
    setSendEmail(false);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Generate Activation Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Company Selection */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Select Company
            </label>
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a company...</option>
              {filteredCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Days */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-medium mb-2">
              <FiCalendar className="inline mr-1" />
              Expiry Period (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-500 text-sm mt-1">
              Code will expire in {expiryDays} days from generation
            </p>
          </div>

          {/* Send Email Option */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                disabled={!selectedCompanyData?.contact_email}
              />
              <span className="text-gray-300">
                <FiMail className="inline mr-1" />
                Send activation code via email
              </span>
            </label>
            {selectedCompanyData && !selectedCompanyData.contact_email && (
              <p className="text-red-400 text-sm mt-1">
                No contact email available for this company
              </p>
            )}
            {selectedCompanyData?.contact_email && (
              <p className="text-gray-500 text-sm mt-1">
                Email will be sent to: {selectedCompanyData.contact_email}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FiSave className="mr-2" />
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateCodeModal;