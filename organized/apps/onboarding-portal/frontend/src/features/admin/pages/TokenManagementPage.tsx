import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TokenManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Token management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenManagementPage;