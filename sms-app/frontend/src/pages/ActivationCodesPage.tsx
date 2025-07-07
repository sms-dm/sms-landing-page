import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiKey, FiBarChart2 } from 'react-icons/fi';
import ActivationCodeList from '../components/admin/ActivationCodeList';
import GenerateCodeModal from '../components/admin/GenerateCodeModal';
import CodeDetailsModal from '../components/admin/CodeDetailsModal';
import ActivationAnalytics from '../components/admin/ActivationAnalytics';

const ActivationCodesPage: React.FC = () => {
  const navigate = useNavigate();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<{ id: number } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'codes' | 'analytics'>('codes');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewDetails = (code: any) => {
    setSelectedCode(code);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/internal-portal')}
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <FiArrowLeft className="mr-2" />
                Back to Portal
              </button>
            </div>
            <h1 className="text-xl font-semibold text-white flex items-center">
              <FiKey className="mr-2" />
              Activation Code Management
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('codes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'codes'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FiKey className="inline mr-2" />
              Activation Codes
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FiBarChart2 className="inline mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'codes' ? (
          <ActivationCodeList
            key={refreshKey}
            onGenerateCode={() => setShowGenerateModal(true)}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <ActivationAnalytics />
        )}
      </div>

      {/* Modals */}
      <GenerateCodeModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={handleGenerateSuccess}
      />

      <CodeDetailsModal
        code={selectedCode}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCode(null);
        }}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};

export default ActivationCodesPage;