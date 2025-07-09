import React from 'react';
import { CompanySetupWizard } from '../components/CompanySetupWizard';

const CompanyManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Company Management</h1>
      <CompanySetupWizard />
    </div>
  );
};

export default CompanyManagementPage;