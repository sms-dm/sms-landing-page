import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
import ActivationHelpPage from './pages/ActivationHelpPage';
import ComingSoonPage from './pages/ComingSoonPage';
import WarpTransition from './pages/WarpTransition';
import PortalAccessPage from './pages/PortalAccessPage';
import OnboardingDemoPage from './pages/OnboardingDemoPage';
import NeuralBackground from './components/NeuralBackground';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check auth on initial load
    return localStorage.getItem('sms-preview-auth') === 'true';
  });

  useEffect(() => {
    // Simple storage listener for cross-tab changes
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem('sms-preview-auth') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={
          <div className="min-h-screen bg-sms-deepBlue relative">
            <div className="neural-bg"></div>
            <NeuralBackground />
            <HomePage />
          </div>
        } />

        {/* Coming Soon page - kept for reference */}
        <Route path="/coming-soon" element={<ComingSoonPage />} />

        {/* Warp transition after login */}
        <Route path="/warp" element={
          isAuthenticated ? <WarpTransition /> : <Navigate to="/" />
        } />

        {/* Protected preview routes */}
        <Route path="/preview" element={
          isAuthenticated ? (
            <div className="min-h-screen bg-sms-deepBlue relative">
              <div className="neural-bg"></div>
              <NeuralBackground />
              <HomePage />
            </div>
          ) : (
            <Navigate to="/" />
          )
        } />
        
        
        {/* Activation help - always accessible */}
        <Route path="/activation-help" element={
          <div className="min-h-screen bg-sms-deepBlue relative">
            <div className="neural-bg"></div>
            <NeuralBackground />
            <ActivationHelpPage />
          </div>
        } />
        
        {/* Portal Access Page - for authenticated users */}
        <Route path="/portals" element={<PortalAccessPage />} />
        
        {/* Onboarding Demo - embedded in React app */}
        <Route path="/demo" element={<OnboardingDemoPage />} />
        
      </Routes>
    </Router>
  );
}

export default App;