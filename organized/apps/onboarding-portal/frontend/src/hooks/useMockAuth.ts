import { User, UserRole } from '@/types';

// Mock users for demo purposes
export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@demo.com',
    role: UserRole.ADMIN,
    companyId: 'demo-company',
    firstName: 'John',
    lastName: 'Admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  manager: {
    id: '2',
    email: 'manager@demo.com',
    role: UserRole.MANAGER,
    companyId: 'demo-company',
    firstName: 'Sarah',
    lastName: 'Manager',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  technician: {
    id: '3',
    email: 'tech@demo.com',
    role: UserRole.TECHNICIAN,
    companyId: 'demo-company',
    firstName: 'Mike',
    lastName: 'Tech',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const useMockAuth = () => {
  // Check if we're in demo mode
  const isDemoMode = window.location.search.includes('demo=true');
  
  const setMockUser = (role: 'admin' | 'manager' | 'technician') => {
    const user = mockUsers[role];
    localStorage.setItem('mockUser', JSON.stringify(user));
    localStorage.setItem('mockToken', 'demo-token-' + role);
    window.location.href = `/${role}?demo=true`;
  };

  const getMockUser = (): User | null => {
    if (!isDemoMode) return null;
    const mockUserStr = localStorage.getItem('mockUser');
    return mockUserStr ? JSON.parse(mockUserStr) : null;
  };

  const clearMockAuth = () => {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockToken');
    window.location.href = '/';
  };

  return {
    isDemoMode,
    setMockUser,
    getMockUser,
    clearMockAuth,
  };
};