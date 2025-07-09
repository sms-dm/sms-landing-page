import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  login as loginAction, 
  logout as logoutAction, 
  register as registerAction,
  updateProfile as updateProfileAction,
  changePassword as changePasswordAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  clearError 
} from '@/store/slices/authSlice';
import { UserRole } from '@/types';

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  inviteToken?: string;
}

interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
  };
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);

  const login = useCallback(async (data: LoginData) => {
    try {
      await dispatch(loginAction(data)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the slice
    }
  }, [dispatch, navigate]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      await dispatch(registerAction(data)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the slice
    }
  }, [dispatch, navigate]);

  const logout = useCallback(async () => {
    await dispatch(logoutAction());
    navigate('/login');
  }, [dispatch, navigate]);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    return dispatch(updateProfileAction(data)).unwrap();
  }, [dispatch]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    return dispatch(changePasswordAction({ currentPassword, newPassword })).unwrap();
  }, [dispatch]);

  const forgotPassword = useCallback(async (email: string) => {
    return dispatch(forgotPasswordAction(email)).unwrap();
  }, [dispatch]);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await dispatch(resetPasswordAction({ token, newPassword })).unwrap();
    navigate('/login');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    
    // Define permission mappings
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: ['*'], // All permissions
      [UserRole.ADMIN]: [
        'manage_company',
        'manage_users',
        'manage_vessels',
        'view_analytics',
        'export_data',
        'manage_tokens',
      ],
      [UserRole.MANAGER]: [
        'manage_vessels',
        'view_analytics',
        'export_data',
        'manage_tokens',
      ],
      [UserRole.TECHNICIAN]: [
        'add_equipment',
        'edit_equipment',
        'view_equipment',
        'upload_documents',
      ],
      [UserRole.HSE_OFFICER]: [
        'view_equipment',
        'view_safety_reports',
        'manage_safety_documents',
        'view_analytics',
        'export_safety_data',
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError: clearAuthError,
    hasRole,
    hasPermission,
  };
}