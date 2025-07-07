import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CompanyManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Company management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagementPage;