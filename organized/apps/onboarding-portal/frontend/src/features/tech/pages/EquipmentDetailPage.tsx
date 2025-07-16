import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EquipmentDetailPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Equipment detail functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentDetailPage;