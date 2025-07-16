import React from 'react';
import { SyncStatus } from '../components/SyncStatus';

const OfflineSyncPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Offline Sync Status</h1>
      <SyncStatus />
    </div>
  );
};

export default OfflineSyncPage;