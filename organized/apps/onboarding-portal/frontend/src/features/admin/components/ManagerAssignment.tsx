import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UserRole } from '@/types';
import { 
  UserPlus, 
  Search, 
  Building, 
  Users, 
  Mail, 
  Phone,
  Shield,
  ChevronRight,
  X
} from 'lucide-react';

interface Manager {
  id: string;
  user: User;
  departmentId?: string;
  departmentName?: string;
  teamSize: number;
  directReports: string[];
}

interface AvailableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isAssigned: boolean;
}

export const ManagerAssignment: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Mock data
  useEffect(() => {
    const mockManagers: Manager[] = [
      {
        id: '1',
        user: {
          id: 'mgr1',
          email: 'john.smith@company.com',
          role: UserRole.MANAGER,
          companyId: 'company1',
          firstName: 'John',
          lastName: 'Smith',
          phoneNumber: '+1 555-0101',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        departmentId: 'dept1',
        departmentName: 'Engineering',
        teamSize: 8,
        directReports: ['tech1', 'tech2', 'tech3']
      },
      {
        id: '2',
        user: {
          id: 'mgr2',
          email: 'sarah.johnson@company.com',
          role: UserRole.MANAGER,
          companyId: 'company1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          phoneNumber: '+1 555-0102',
          isActive: true,
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16')
        },
        departmentId: 'dept2',
        departmentName: 'Deck Operations',
        teamSize: 5,
        directReports: ['tech4', 'tech5']
      }
    ];

    const mockAvailableUsers: AvailableUser[] = [
      {
        id: 'user3',
        email: 'michael.brown@company.com',
        firstName: 'Michael',
        lastName: 'Brown',
        role: UserRole.TECHNICIAN,
        isAssigned: false
      },
      {
        id: 'user4',
        email: 'emma.davis@company.com',
        firstName: 'Emma',
        lastName: 'Davis',
        role: UserRole.TECHNICIAN,
        isAssigned: false
      },
      {
        id: 'user5',
        email: 'james.wilson@company.com',
        firstName: 'James',
        lastName: 'Wilson',
        role: UserRole.TECHNICIAN,
        isAssigned: true
      }
    ];

    setManagers(mockManagers);
    setAvailableUsers(mockAvailableUsers);
  }, []);

  const filteredManagers = managers.filter(manager =>
    manager.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (manager.departmentName && manager.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePromoteToManager = () => {
    if (!selectedUserId) return;

    const user = availableUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    // Create new manager from selected user
    const newManager: Manager = {
      id: String(Date.now()),
      user: {
        id: user.id,
        email: user.email,
        role: UserRole.MANAGER,
        companyId: 'company1',
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      teamSize: 0,
      directReports: []
    };

    setManagers(prev => [...prev, newManager]);
    setAvailableUsers(prev => prev.map(u => 
      u.id === selectedUserId ? { ...u, isAssigned: true } : u
    ));
    
    setShowAssignModal(false);
    setSelectedUserId('');
  };

  const handleRemoveManager = (managerId: string) => {
    if (confirm('Are you sure you want to remove this manager? Their team members will be unassigned.')) {
      setManagers(prev => prev.filter(m => m.id !== managerId));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manager Assignment</h1>
        <p className="mt-2 text-gray-600">Assign and manage team leaders across departments</p>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowAssignModal(true)}
          className="ml-4 flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Manager
        </Button>
      </div>

      {/* Managers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredManagers.map((manager) => (
          <Card key={manager.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {manager.user.firstName} {manager.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{manager.user.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveManager(manager.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {manager.user.email}
              </div>
              
              {manager.user.phoneNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {manager.user.phoneNumber}
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-2" />
                {manager.departmentName || 'No department assigned'}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                {manager.teamSize} team members
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
                onClick={() => setSelectedManager(manager)}
              >
                View Team
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredManagers.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No managers found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search criteria' : 'Start by assigning your first manager'}
          </p>
        </div>
      )}

      {/* Assign Manager Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Assign New Manager</h2>
            <p className="text-gray-600 mb-6">
              Select a user to promote to manager role. They will be able to oversee team members and approve equipment entries.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a user...</option>
                  {availableUsers
                    .filter(user => !user.isAssigned && user.role !== UserRole.MANAGER)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} - {user.email}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The selected user will be granted manager permissions including:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>Team member management</li>
                  <li>Equipment approval rights</li>
                  <li>Department oversight</li>
                  <li>Report generation</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUserId('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePromoteToManager}
                  disabled={!selectedUserId}
                >
                  Assign as Manager
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team View Modal */}
      {selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedManager.user.firstName} {selectedManager.user.lastName}'s Team
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedManager(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {selectedManager.directReports.length > 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Team member details would be displayed here
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No team members assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};