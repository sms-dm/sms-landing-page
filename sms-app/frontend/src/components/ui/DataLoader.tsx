import React from 'react';
import { FiLoader } from 'react-icons/fi';

interface DataLoaderProps {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DataLoader: React.FC<DataLoaderProps> = ({
  loading,
  error,
  empty = false,
  emptyComponent,
  errorComponent,
  loadingComponent,
  children,
  className = '',
}) => {
  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-gray-400 text-sm">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Show empty state
  if (empty) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-400">No data to display</p>
      </div>
    );
  }

  // Show children (actual content)
  return <>{children}</>;
};

// Inline loader for small components
export const InlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <FiLoader className={`${sizeClasses[size]} text-gray-400 animate-spin`} />;
};

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`relative ${className} ${loading ? 'cursor-wait' : ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center space-x-2">
          <FiLoader className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default DataLoader;