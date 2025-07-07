import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VesselManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Vessel Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vessel management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VesselManagementPage;