import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OnboardingSessionPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Onboarding session functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSessionPage;