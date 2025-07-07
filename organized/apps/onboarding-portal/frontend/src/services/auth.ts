import { User, UserRole } from '@/types';
import { getEnv } from '@/config/env';
import { tokenStorage } from '@/utils/tokenStorage';
import { apiClient } from './axios';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  inviteToken?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

interface UpdateUserRequest {
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

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private apiUrl = '/v1/auth';

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`${this.apiUrl}/login`, data);
      
      // Store tokens
      tokenStorage.setToken(response.token);
      tokenStorage.setRefreshToken(response.refreshToken);
      
      return response;
    } catch (error) {
      // Demo mode fallback
      if (getEnv('enableMockData')) {
        return this.demoLogin(data);
      }
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`${this.apiUrl}/register`, data);
      
      // Store tokens
      tokenStorage.setToken(response.token);
      tokenStorage.setRefreshToken(response.refreshToken);
      
      return response;
    } catch (error) {
      // Demo mode fallback
      if (getEnv('enableMockData')) {
        return this.demoRegister(data);
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.apiUrl}/logout`);
    } catch (error) {
      // Ignore errors on logout
    } finally {
      tokenStorage.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>(`${this.apiUrl}/me`);
      return response;
    } catch (error) {
      // Demo mode fallback
      if (getEnv('enableMockData')) {
        return this.demoGetCurrentUser();
      }
      throw error;
    }
  }

  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`${this.apiUrl}/me`, data);
      return response;
    } catch (error) {
      // Demo mode fallback
      if (getEnv('enableMockData')) {
        return this.demoUpdateUser(data);
      }
      throw error;
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post(`${this.apiUrl}/change-password`, data);
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(`${this.apiUrl}/forgot-password`, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  private async refreshToken(): Promise<AuthResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken });
    return response;
  }

  // Demo mode implementations
  private demoLogin(data: LoginRequest): AuthResponse {
    const demoUsers = [
      { email: 'admin@demo.com', password: 'Demo123!', role: UserRole.ADMIN, name: 'Demo Admin' },
      { email: 'manager@demo.com', password: 'Demo123!', role: UserRole.MANAGER, name: 'Demo Manager' },
      { email: 'tech@demo.com', password: 'Demo123!', role: UserRole.TECHNICIAN, name: 'Demo Technician' },
      { email: 'hse@demo.com', password: 'Demo123!', role: UserRole.HSE_OFFICER, name: 'Demo HSE Officer' },
    ];

    const demoUser = demoUsers.find(u => u.email === data.email && u.password === data.password);
    
    if (!demoUser) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: `demo-${Date.now()}`,
      email: demoUser.email,
      firstName: demoUser.name.split(' ')[0],
      lastName: demoUser.name.split(' ')[1],
      role: demoUser.role,
      companyId: 'demo-company',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response: AuthResponse = {
      user,
      token: 'demo-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      expiresIn: data.rememberMe ? 2592000 : 604800,
    };

    // Store in localStorage for demo persistence
    localStorage.setItem('demoUser', JSON.stringify(user));
    
    return response;
  }

  private demoRegister(data: RegisterRequest): AuthResponse {
    const [firstName, ...lastNameParts] = data.fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const user: User = {
      id: `demo-${Date.now()}`,
      email: data.email,
      firstName,
      lastName,
      role: data.role,
      companyId: 'demo-company',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response: AuthResponse = {
      user,
      token: 'demo-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      expiresIn: 604800,
    };

    // Store in localStorage for demo persistence
    localStorage.setItem('demoUser', JSON.stringify(user));
    
    return response;
  }

  private demoGetCurrentUser(): User {
    const demoUserStr = localStorage.getItem('demoUser');
    if (!demoUserStr) {
      throw new Error('No user found');
    }
    
    return JSON.parse(demoUserStr);
  }

  private demoUpdateUser(data: UpdateUserRequest): User {
    const currentUser = this.demoGetCurrentUser();
    
    if (data.fullName) {
      const [firstName, ...lastNameParts] = data.fullName.split(' ');
      currentUser.firstName = firstName;
      currentUser.lastName = lastNameParts.join(' ');
    }
    
    const updatedUser = {
      ...currentUser,
      phoneNumber: data.phoneNumber || currentUser.phoneNumber,
      avatarUrl: data.avatarUrl || currentUser.avatarUrl,
      updatedAt: new Date(),
    };
    
    localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    return updatedUser;
  }
}

export const authService = new AuthService();