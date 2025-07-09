import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import { store } from './store';
import { router } from './app/router';
import { ErrorFallback } from './components/ErrorFallback';
import { AnimatedToaster } from './components/ui/animated-toast';
import { SplashScreen } from './components/SplashScreen';
import { registerServiceWorker } from './utils/serviceWorker';
import { EnhancedErrorBoundary } from './components/EnhancedErrorBoundary';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize service worker for PWA and offline support
    registerServiceWorker();
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen 
          duration={1500} 
          onComplete={() => setShowSplash(false)} 
        />
      )}
      
      <EnhancedErrorBoundary
        level="page"
        onError={(error, errorInfo) => {
          console.error('App Error:', error, errorInfo);
        }}
      >
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <AnimatedToaster />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </Provider>
      </EnhancedErrorBoundary>
    </>
  );
}