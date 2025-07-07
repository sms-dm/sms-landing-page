// HSE Onboarding Page Component
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../hooks/useAuth';
import { hseService } from '../../../services/hse';
import { HSEOnboarding, UserRole } from '../../../types';
import { SafetyEquipmentSection } from './SafetyEquipmentSection';
import { CertificatesSection } from './CertificatesSection';
import { EmergencyContactsSection } from './EmergencyContactsSection';
import { SafetyStatusSection } from './SafetyStatusSection';
import { toast } from '../../../components/ui/toaster';

export const HSEOnboardingPage: React.FC = () => {
  const { vesselId } = useParams<{ vesselId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hseData, setHseData] = useState<HSEOnboarding | null>(null);
  const [activeTab, setActiveTab] = useState<'equipment' | 'certificates' | 'contacts' | 'status'>('equipment');

  // Check if user has permission to edit
  const canEdit = user && [
    UserRole.HSE_OFFICER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ].includes(user.role);

  useEffect(() => {
    if (vesselId) {
      fetchHSEData();
    }
  }, [vesselId]);

  const fetchHSEData = async () => {
    try {
      setLoading(true);
      const data = await hseService.getHSEOnboarding(vesselId!);
      setHseData(data);
    } catch (error) {
      toast.error('Failed to fetch HSE data');
      console.error('Error fetching HSE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hseData || !canEdit) return;

    try {
      setSaving(true);
      await hseService.updateHSEOnboarding(vesselId!, hseData);
      toast.success('HSE data saved successfully');
    } catch (error) {
      toast.error('Failed to save HSE data');
      console.error('Error saving HSE data:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateHseData = (updates: Partial<HSEOnboarding>) => {
    if (!canEdit) return;
    setHseData(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HSE data...</p>
        </div>
      </div>
    );
  }

  if (!hseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-4">No HSE Data Found</h2>
          <p className="text-gray-600 mb-4">
            HSE onboarding data has not been initialized for this vessel.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HSE Onboarding</h1>
              <p className="text-gray-600 mt-1">
                Health, Safety & Environment compliance for vessel operations
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              {canEdit && (
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b">
            <button
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'equipment'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('equipment')}
            >
              Safety Equipment
            </button>
            <button
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'certificates'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('certificates')}
            >
              Certificates
            </button>
            <button
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('contacts')}
            >
              Emergency Contacts
            </button>
            <button
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('status')}
            >
              Safety Status
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'equipment' && (
            <SafetyEquipmentSection
              equipmentStatus={hseData.safetyEquipmentStatus}
              onUpdate={(status) => updateHseData({ safetyEquipmentStatus: status })}
              canEdit={canEdit}
            />
          )}
          {activeTab === 'certificates' && (
            <CertificatesSection
              vesselId={vesselId!}
              certificates={hseData.certificates}
              onUpdate={(certificates) => updateHseData({ certificates })}
              canEdit={canEdit}
            />
          )}
          {activeTab === 'contacts' && (
            <EmergencyContactsSection
              vesselId={vesselId!}
              contacts={hseData.emergencyContacts}
              onUpdate={(contacts) => updateHseData({ emergencyContacts: contacts })}
              canEdit={canEdit}
            />
          )}
          {activeTab === 'status' && (
            <SafetyStatusSection
              status={hseData.currentSafetyStatus}
              onUpdate={(status) => updateHseData({ currentSafetyStatus: status })}
              canEdit={canEdit}
            />
          )}
        </div>

        {/* Last Updated Info */}
        {hseData.lastUpdatedAt && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Last updated: {new Date(hseData.lastUpdatedAt).toLocaleString()}
            {hseData.lastUpdatedBy && ` by ${hseData.lastUpdatedBy}`}
          </div>
        )}
      </div>
    </div>
  );
};