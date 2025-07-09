import React from 'react';
import { VesselSetup } from '../components/VesselSetup';
const VesselManagementPage: React.FC = () => {
  return <div className="container mx-auto p-6"><h1 className="text-2xl font-bold mb-6">Vessel Management</h1><VesselSetup /></div>;
};
export default VesselManagementPage;
