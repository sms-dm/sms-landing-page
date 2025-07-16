import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  FiX,
  FiCalendar,
  FiMail,
  FiUser,
  FiAnchor,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../../services/api';

interface CodeDetails {
  id: number;
  code: string;
  company_id: number;
  company_name: string;
  contact_email?: string;
  contact_name?: string;
  expires_at: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
  reminder_sent_at?: string;
  expired_notification_sent: boolean;
  company_created_at: string;
  activatedBy?: {
    id: number;
    email: string;
    name?: string;
    created_at: string;
  };
  companyCodesHistory: Array<{
    id: number;
    code: string;
    expires_at: string;
    activated_at?: string;
    created_at: string;
  }>;
}

interface CodeDetailsModalProps {
  code: { id: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const CodeDetailsModal: React.FC<CodeDetailsModalProps> = ({
  code,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [details, setDetails] = useState<CodeDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && code) {
      fetchCodeDetails();
    }
  }, [isOpen, code]);

  const fetchCodeDetails = async () => {
    if (!code) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/admin/activation/codes/${code.id}`);
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching code details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!details) return null;
    
    if (details.activated_at) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-500">
          <FiCheckCircle className="mr-1" />
          Activated
        </span>
      );
    }
    if (new Date(details.expires_at) < new Date()) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-500">
          <FiAlertCircle className="mr-1" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-500">
        <FiClock className="mr-1" />
        Active
      </span>
    );
  };

  if (!isOpen || !code) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white">Activation Code Details</h2>
            {getStatusBadge()}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center text-gray-400">
              <FiRefreshCw className="animate-spin mr-2" />
              Loading details...
            </div>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Code Information */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Code Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Activation Code</p>
                  <p className="font-mono text-white text-lg">{details.code}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Created Date</p>
                  <p className="text-white">{format(new Date(details.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expiry Date</p>
                  <p className="text-white">{format(new Date(details.expires_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                {details.activated_at && (
                  <div>
                    <p className="text-gray-400 text-sm">Activated Date</p>
                    <p className="text-white">{format(new Date(details.activated_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
              </div>
              
              {details.reminder_sent_at && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-yellow-400 text-sm flex items-center">
                    <FiMail className="mr-2" />
                    Reminder sent on {format(new Date(details.reminder_sent_at), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {/* Company Information */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Company Name</p>
                  <p className="text-white font-medium">{details.company_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Company ID</p>
                  <p className="text-white">{details.company_id}</p>
                </div>
                {details.contact_email && (
                  <div>
                    <p className="text-gray-400 text-sm">Contact Email</p>
                    <p className="text-white">{details.contact_email}</p>
                  </div>
                )}
                {details.contact_name && (
                  <div>
                    <p className="text-gray-400 text-sm">Contact Name</p>
                    <p className="text-white">{details.contact_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activation Details */}
            {details.activatedBy && (
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activation Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Activated By</p>
                    <p className="text-white">{details.activatedBy.name || details.activatedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User Email</p>
                    <p className="text-white">{details.activatedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User ID</p>
                    <p className="text-white">{details.activatedBy.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User Created</p>
                    <p className="text-white">{format(new Date(details.activatedBy.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Code History */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Code History</h3>
              <div className="space-y-2">
                {details.companyCodesHistory.map((historyCode) => (
                  <div 
                    key={historyCode.id}
                    className={`flex justify-between items-center p-3 rounded-md ${
                      historyCode.id === details.id ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-white">{historyCode.code}</span>
                      {historyCode.activated_at ? (
                        <span className="text-green-500 text-sm flex items-center">
                          <FiCheckCircle className="mr-1" />
                          Activated
                        </span>
                      ) : new Date(historyCode.expires_at) < new Date() ? (
                        <span className="text-red-500 text-sm flex items-center">
                          <FiAlertCircle className="mr-1" />
                          Expired
                        </span>
                      ) : (
                        <span className="text-blue-500 text-sm flex items-center">
                          <FiClock className="mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Created {format(new Date(historyCode.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No details available
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeDetailsModal;