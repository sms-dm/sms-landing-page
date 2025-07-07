import React from 'react';

// Temporarily disabled - Material UI not installed
const SyncDashboard = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Sync Dashboard</h2>
      <p className="text-gray-600">
        This component requires Material UI to be installed. 
        Please install @mui/material and @mui/icons-material to enable this feature.
      </p>
    </div>
  );
};

export default SyncDashboard;

// Original implementation commented out due to missing Material UI dependency
// To restore functionality, install:
// npm install @mui/material @emotion/react @emotion/styled @mui/icons-material