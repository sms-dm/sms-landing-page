import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EquipmentFormPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Equipment form functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentFormPage;