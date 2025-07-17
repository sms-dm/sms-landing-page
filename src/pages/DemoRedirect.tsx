import { useEffect } from 'react';

function DemoRedirect() {
  useEffect(() => {
    // Redirect to the static demo files
    window.location.href = '/demo/index.html';
  }, []);

  return (
    <div className="min-h-screen bg-sms-deepBlue flex items-center justify-center">
      <div className="text-sms-lightGray">Redirecting to demo...</div>
    </div>
  );
}

export default DemoRedirect;