import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiFilter, FiCheck, FiArchive, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Feedback {
  id: number;
  user_email: string;
  user_name: string;
  user_role: string;
  company_name: string;
  category: string;
  feedback: string;
  page: string;
  status: 'new' | 'read' | 'resolved' | 'archived';
  created_at: string;
}

export default function FeedbackManagement() {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, categoryFilter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackList(data.feedback || []);
      } else if (response.status === 403) {
        toast.error('Access denied');
        navigate('/dashboard/manager');
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Status updated');
        fetchFeedback();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'improvement': return '💡';
      case 'question': return '❓';
      default: return '💬';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-2">Review and manage user feedback</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-500" />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {feedbackList.length} feedback items
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                      <h3 className="font-semibold text-gray-900">{item.user_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <span>{item.user_email}</span> • 
                      <span> {item.company_name}</span> • 
                      <span> {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-gray-800 mb-3">{item.feedback}</p>

                    <div className="text-sm text-gray-500">
                      Page: {item.page} • Role: {item.user_role}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {item.status === 'new' && (
                      <button
                        onClick={() => updateStatus(item.id, 'read')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Mark as read"
                      >
                        <FiEye />
                      </button>
                    )}
                    {(item.status === 'new' || item.status === 'read') && (
                      <button
                        onClick={() => updateStatus(item.id, 'resolved')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Mark as resolved"
                      >
                        <FiCheck />
                      </button>
                    )}
                    {item.status !== 'archived' && (
                      <button
                        onClick={() => updateStatus(item.id, 'archived')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="Archive"
                      >
                        <FiArchive />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}