import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OfflineSyncPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Offline Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Offline sync functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineSyncPage;