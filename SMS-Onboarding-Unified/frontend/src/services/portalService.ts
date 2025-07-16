import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface PortalAccess {
  onboardingComplete: boolean;
  hasMaintenanceAccess: boolean;
  vesselName?: string;
  onboardingStatus?: string;
}

export const portalService = {
  /**
   * Check the current portal access status for the authenticated user
   */
  async checkPortalAccess(): Promise<PortalAccess> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          onboardingComplete: false,
          hasMaintenanceAccess: false
        };
      }

      const response = await axios.get(`${API_BASE_URL}/vessels/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const vessels = response.data;
      const completedVessel = vessels.find((v: any) => 
        v.onboardingStatus === 'APPROVED' || v.onboardingStatus === 'EXPORTED'
      );

      return {
        onboardingComplete: !!completedVessel,
        hasMaintenanceAccess: !!completedVessel,
        vesselName: completedVessel?.name,
        onboardingStatus: completedVessel?.onboardingStatus
      };
    } catch (error) {
      console.error('Error checking portal access:', error);
      return {
        onboardingComplete: false,
        hasMaintenanceAccess: false
      };
    }
  },

  /**
   * Update vessel onboarding status
   */
  async updateOnboardingStatus(vesselId: string, status: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/vessels/${vesselId}/onboarding-status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      throw error;
    }
  },

  /**
   * Mark onboarding as complete and enable maintenance portal access
   */
  async completeOnboarding(vesselId: string): Promise<void> {
    try {
      await this.updateOnboardingStatus(vesselId, 'APPROVED');
      
      // Store completion flag
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('completedVesselId', vesselId);
      
      // Optional: Sync with maintenance portal
      await this.syncWithMaintenancePortal(vesselId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  },

  /**
   * Sync vessel data with maintenance portal
   */
  async syncWithMaintenancePortal(vesselId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      
      // Call integration endpoint to sync data
      await axios.post(
        `${API_BASE_URL}/integration/sync-vessel`,
        { vesselId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error syncing with maintenance portal:', error);
      // Don't throw - this is optional
    }
  }
};

export default portalService;