/**
 * Shared authentication service for seamless portal switching
 * This service ensures authentication tokens are accessible across both portals
 */

export interface AuthToken {
  token: string;
  user: any;
  expiresAt?: Date;
}

export interface PortalAuth {
  onboardingPortal?: AuthToken;
  maintenancePortal?: AuthToken;
  currentPortal: 'onboarding' | 'maintenance';
}

const AUTH_STORAGE_KEY = 'sms_auth';
const PORTAL_STATUS_KEY = 'sms_portal_status';

export const sharedAuthService = {
  /**
   * Store authentication data that can be accessed by both portals
   */
  setAuth(token: string, user: any, portal: 'onboarding' | 'maintenance' = 'onboarding') {
    // Store in regular localStorage for current portal
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Store in shared format
    const authData: PortalAuth = this.getSharedAuth() || {
      currentPortal: portal
    };
    
    authData[portal === 'onboarding' ? 'onboardingPortal' : 'maintenancePortal'] = {
      token,
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    authData.currentPortal = portal;
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  },

  /**
   * Get shared authentication data
   */
  getSharedAuth(): PortalAuth | null {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Check if user has access to maintenance portal
   */
  hasMaintenanceAccess(): boolean {
    const status = localStorage.getItem(PORTAL_STATUS_KEY);
    if (!status) return false;
    
    try {
      const data = JSON.parse(status);
      return data.onboardingComplete === true;
    } catch {
      return false;
    }
  },

  /**
   * Set portal access status
   */
  setPortalStatus(onboardingComplete: boolean, vesselId?: string) {
    localStorage.setItem(PORTAL_STATUS_KEY, JSON.stringify({
      onboardingComplete,
      completedVesselId: vesselId,
      updatedAt: new Date().toISOString()
    }));
  },

  /**
   * Clear all authentication data
   */
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(PORTAL_STATUS_KEY);
  },

  /**
   * Switch to a different portal
   */
  switchPortal(targetPortal: 'onboarding' | 'maintenance') {
    const authData = this.getSharedAuth();
    if (!authData) return false;
    
    const portalAuth = targetPortal === 'onboarding' 
      ? authData.onboardingPortal 
      : authData.maintenancePortal;
    
    if (!portalAuth) return false;
    
    // Update current portal auth
    localStorage.setItem('token', portalAuth.token);
    localStorage.setItem('user', JSON.stringify(portalAuth.user));
    
    // Update current portal indicator
    authData.currentPortal = targetPortal;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    
    return true;
  }
};

export default sharedAuthService;