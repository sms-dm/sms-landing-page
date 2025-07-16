import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiMail,
  FiClock,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiKey
} from 'react-icons/fi';
import api from '../../services/api';

interface ActivationCode {
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
  user_count: number;
  vessel_count: number;
}

interface ActivationCodeListProps {
  onGenerateCode: () => void;
  onViewDetails: (code: ActivationCode) => void;
}

const ActivationCodeList: React.FC<ActivationCodeListProps> = ({
  onGenerateCode,
  onViewDetails
}) => {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/activation/codes', {
        params: {
          search: searchTerm,
          status: statusFilter,
          page: currentPage,
          limit: 20
        }
      });
      setCodes(response.data.codes);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching activation codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCodeStatus = (code: ActivationCode) => {
    if (code.activated_at) {
      return { status: 'Activated', color: 'text-green-500', bgColor: 'bg-green-500/10' };
    }
    if (new Date(code.expires_at) < new Date()) {
      return { status: 'Expired', color: 'text-red-500', bgColor: 'bg-red-500/10' };
    }
    return { status: 'Active', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
  };

  const handleExtendExpiry = async (codeId: number, days: number = 30) => {
    try {
      await api.put(`/admin/activation/codes/${codeId}/extend`, { days });
      fetchCodes();
    } catch (error) {
      console.error('Error extending code:', error);
    }
  };

  const handleRevokeCode = async (codeId: number) => {
    if (!window.confirm('Are you sure you want to revoke this activation code?')) return;
    
    try {
      await api.delete(`/admin/activation/codes/${codeId}`);
      fetchCodes();
    } catch (error) {
      console.error('Error revoking code:', error);
    }
  };

  const handleExportCodes = async () => {
    try {
      const response = await api.get('/admin/activation/export', {
        params: { status: statusFilter },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activation-codes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting codes:', error);
    }
  };

  const handleSendEmail = async (code: ActivationCode) => {
    if (!code.contact_email) {
      alert('No contact email available for this company');
      return;
    }
    
    try {
      await api.post('/admin/activation/codes/generate', {
        companyId: code.company_id,
        sendEmail: true
      });
      alert('Activation code email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FiKey className="mr-2" />
          Activation Codes
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCodes}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <FiDownload className="mr-2" />
            Export CSV
          </button>
          <button
            onClick={onGenerateCode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Generate Code
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="activated">Activated</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3 text-gray-400 font-medium">Code</th>
              <th className="pb-3 text-gray-400 font-medium">Company</th>
              <th className="pb-3 text-gray-400 font-medium">Status</th>
              <th className="pb-3 text-gray-400 font-medium">Created</th>
              <th className="pb-3 text-gray-400 font-medium">Expires</th>
              <th className="pb-3 text-gray-400 font-medium">Usage</th>
              <th className="pb-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading activation codes...
                </td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No activation codes found
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const status = getCodeStatus(code);
                return (
                  <tr
                    key={code.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => onViewDetails(code)}
                  >
                    <td className="py-4">
                      <span className="font-mono text-white">{code.code}</span>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-white font-medium">{code.company_name}</p>
                        {code.contact_email && (
                          <p className="text-gray-400 text-sm">{code.contact_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.status === 'Activated' && <FiCheck className="mr-1" />}
                        {status.status === 'Expired' && <FiX className="mr-1" />}
                        {status.status === 'Active' && <FiClock className="mr-1" />}
                        {status.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">
                      {format(new Date(code.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 text-gray-400">
                      {format(new Date(code.expires_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4">
                      <div className="text-sm">
                        <p className="text-gray-400">
                          {code.user_count} users, {code.vessel_count} vessels
                        </p>
                      </div>
                    </td>
                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setSelectedCode(selectedCode === code.id ? null : code.id)}
                          className="text-gray-400 hover:text-white p-2 rounded transition-colors"
                        >
                          <FiMoreVertical />
                        </button>
                        
                        {selectedCode === code.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                            {!code.activated_at && new Date(code.expires_at) > new Date() && (
                              <>
                                <button
                                  onClick={() => handleSendEmail(code)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center"
                                >
                                  <FiMail className="mr-2" />
                                  Send Email
                                </button>
                                <button
                                  onClick={() => handleExtendExpiry(code.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center"
                                >
                                  <FiCalendar className="mr-2" />
                                  Extend 30 Days
                                </button>
                                <button
                                  onClick={() => handleRevokeCode(code.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 flex items-center"
                                >
                                  <FiX className="mr-2" />
                                  Revoke Code
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivationCodeList;