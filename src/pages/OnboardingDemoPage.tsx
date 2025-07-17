import { useEffect } from 'react';

function OnboardingDemoPage() {
  useEffect(() => {
    // Remove the landing page auth when entering demo
    localStorage.removeItem('sms-preview-auth');
  }, []);

  return (
    <div className="w-full h-screen">
      <iframe 
        src="/demo/index.html" 
        className="w-full h-full border-0"
        title="SMS Onboarding Demo"
      />
    </div>
  );
}

export default OnboardingDemoPage;