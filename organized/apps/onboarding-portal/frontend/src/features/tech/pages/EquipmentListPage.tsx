import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EquipmentListPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Equipment list functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentListPage;