import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminReportsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Admin reports functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsPage;