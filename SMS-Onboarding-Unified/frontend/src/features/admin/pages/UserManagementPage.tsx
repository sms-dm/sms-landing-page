import React from 'react';
import { UserManagement } from '../components/UserManagement';
const UserManagementPage: React.FC = () => {
  return <div className="container mx-auto p-6"><h1 className="text-2xl font-bold mb-6">User Management</h1><UserManagement /></div>;
};
export default UserManagementPage;
