import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSettings, FiMail, FiBell, FiUser, FiCheck, FiArrowLeft,
  FiMonitor, FiCalendar, FiClock, FiAnchor, FiGrid,
  FiList, FiMap, FiVolume2, FiSmartphone, FiMoon, FiSun
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface UserSettingsData {
  // Email Notifications
  notify_critical_faults: boolean;
  notify_maintenance_reminders: boolean;
  notify_fault_resolutions: boolean;
  
  // Display Preferences
  theme: 'dark' | 'light';
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
  
  // Work Preferences
  default_vessel_id: number | null;
  equipment_view: 'grid' | 'list' | 'map';
  equipment_sort: 'name' | 'location' | 'criticality' | 'last_maintained';
  show_decommissioned: boolean;
  
  // Communication Preferences
  notification_sound: boolean;
  desktop_notifications: boolean;
  sms_notifications: boolean;
  phone_number: string | null;
}

interface Vessel {
  id: number;
  name: string;
  imo_number: string;
  vessel_type: string;
  status: string;
}

export default function UserSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [settings, setSettings] = useState<UserSettingsData>({
    // Email Notifications
    notify_critical_faults: true,
    notify_maintenance_reminders: true,
    notify_fault_resolutions: true,
    // Display Preferences
    theme: 'dark',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    // Work Preferences
    default_vessel_id: null,
    equipment_view: 'grid',
    equipment_sort: 'name',
    show_decommissioned: false,
    // Communication Preferences
    notification_sound: true,
    desktop_notifications: true,
    sms_notifications: false,
    phone_number: null
  });

  useEffect(() => {
    fetchUserSettings();
    fetchVessels();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/auth/user/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Apply theme immediately
        if (data.theme) {
          document.documentElement.classList.toggle('dark', data.theme === 'dark');
          document.documentElement.classList.toggle('light', data.theme === 'light');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const response = await fetch('/api/vessels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVessels(data);
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
    }
  };

  const handleChange = (field: keyof UserSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Apply theme changes immediately
    if (field === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
      document.documentElement.classList.toggle('light', value === 'light');
      localStorage.setItem('sms_theme', value);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/auth/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    // Navigate back to the appropriate dashboard based on role
    if (user?.role === 'admin') {
      navigate('/dashboard/internal');
    } else if (user?.role === 'manager') {
      navigate('/dashboard/manager');
    } else {
      navigate('/dashboard/technician');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sms-dark flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sms-dark">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <FiSettings className="mr-3" />
                Settings
              </h1>
              <p className="text-gray-400 mt-2">Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <FiUser className="text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Role:</span>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <span className="text-gray-500">Company:</span>
              <p className="font-medium">{user?.company?.name}</p>
            </div>
          </div>
        </div>

        {/* Display Preferences Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <FiMonitor className="text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Display Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Theme Selection */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                {settings.theme === 'dark' ? <FiMoon className="mt-1 text-gray-400" /> : <FiSun className="mt-1 text-yellow-400" />}
                <div>
                  <h3 className="text-white font-medium">Theme</h3>
                  <p className="text-gray-400 text-sm mt-1">Choose your preferred theme</p>
                </div>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiCalendar className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Date Format</h3>
                  <p className="text-gray-400 text-sm mt-1">How dates are displayed throughout the app</p>
                </div>
              </div>
              <select
                value={settings.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            {/* Time Format */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiClock className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Time Format</h3>
                  <p className="text-gray-400 text-sm mt-1">12-hour or 24-hour format</p>
                </div>
              </div>
              <select
                value={settings.time_format}
                onChange={(e) => handleChange('time_format', e.target.value)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Work Preferences Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <FiAnchor className="text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Work Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Default Vessel */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiAnchor className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Default Vessel</h3>
                  <p className="text-gray-400 text-sm mt-1">Automatically select this vessel when you log in</p>
                </div>
              </div>
              <select
                value={settings.default_vessel_id || ''}
                onChange={(e) => handleChange('default_vessel_id', e.target.value ? Number(e.target.value) : null)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No default</option>
                {vessels.map(vessel => (
                  <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
                ))}
              </select>
            </div>

            {/* Equipment View */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiGrid className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Equipment View</h3>
                  <p className="text-gray-400 text-sm mt-1">Default view for equipment lists</p>
                </div>
              </div>
              <select
                value={settings.equipment_view}
                onChange={(e) => handleChange('equipment_view', e.target.value)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
                <option value="map">Map View</option>
              </select>
            </div>

            {/* Equipment Sort */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiList className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Equipment Sort Order</h3>
                  <p className="text-gray-400 text-sm mt-1">How equipment is sorted by default</p>
                </div>
              </div>
              <select
                value={settings.equipment_sort}
                onChange={(e) => handleChange('equipment_sort', e.target.value)}
                className="bg-gray-600 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">By Name</option>
                <option value="location">By Location</option>
                <option value="criticality">By Criticality</option>
                <option value="last_maintained">By Last Maintained</option>
              </select>
            </div>

            {/* Show Decommissioned */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiBell className="mt-1 text-gray-400" />
                <div>
                  <h3 className="text-white font-medium">Show Decommissioned Equipment</h3>
                  <p className="text-gray-400 text-sm mt-1">Include decommissioned equipment in lists</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('show_decommissioned', !settings.show_decommissioned)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.show_decommissioned ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.show_decommissioned ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Communication Preferences Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <FiBell className="text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Communication Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Notification Sound */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiVolume2 className={`mt-1 ${settings.notification_sound ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">Notification Sound</h3>
                  <p className="text-gray-400 text-sm mt-1">Play a sound for in-app notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('notification_sound', !settings.notification_sound)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notification_sound ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notification_sound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiMonitor className={`mt-1 ${settings.desktop_notifications ? 'text-blue-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">Desktop Notifications</h3>
                  <p className="text-gray-400 text-sm mt-1">Show browser notifications for important updates</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('desktop_notifications', !settings.desktop_notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.desktop_notifications ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.desktop_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiSmartphone className={`mt-1 ${settings.sms_notifications ? 'text-purple-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">SMS Notifications</h3>
                  <p className="text-gray-400 text-sm mt-1">Receive critical alerts via SMS (coming soon)</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('sms_notifications', !settings.sms_notifications)}
                disabled
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.sms_notifications ? 'bg-blue-600' : 'bg-gray-600'
                } opacity-50 cursor-not-allowed`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Email Notifications Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <FiMail className="text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Email Notifications</h2>
          </div>

          <div className="space-y-4">
            {/* Critical Fault Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiBell className={`mt-1 ${settings.notify_critical_faults ? 'text-red-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">Critical Fault Alerts</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {user?.role === 'manager' 
                      ? 'Receive email alerts when your team reports critical faults'
                      : 'Receive email confirmations for critical faults you report'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChange('notify_critical_faults', !settings.notify_critical_faults)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notify_critical_faults ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notify_critical_faults ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Maintenance Reminder Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiBell className={`mt-1 ${settings.notify_maintenance_reminders ? 'text-yellow-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">Maintenance Reminders</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Receive email reminders 7 days before scheduled maintenance is due
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChange('notify_maintenance_reminders', !settings.notify_maintenance_reminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notify_maintenance_reminders ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notify_maintenance_reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Fault Resolution Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiBell className={`mt-1 ${settings.notify_fault_resolutions ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-white font-medium">Fault Resolution Updates</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Receive email notifications when faults are resolved
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChange('notify_fault_resolutions', !settings.notify_fault_resolutions)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notify_fault_resolutions ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notify_fault_resolutions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> You'll still see all notifications in your dashboard regardless of email preferences.
              These settings only control which notifications are sent to your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}