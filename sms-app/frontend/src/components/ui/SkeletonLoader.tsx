import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rect',
  width = '100%',
  height = 20,
  count = 1,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded';
      case 'rect':
      default:
        return 'rounded-lg';
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-gray-700 ${getVariantClasses()} ${className}`}
      style={{
        width,
        height,
        marginBottom: count > 1 && i < count - 1 ? '8px' : undefined,
      }}
    />
  ));

  return <>{skeletons}</>;
};

// Specific skeleton components for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-sms-dark border border-gray-700 rounded-xl p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader variant="circle" width={40} height={40} />
      <SkeletonLoader width={80} height={32} />
    </div>
    <SkeletonLoader variant="text" width="60%" height={16} className="mb-2" />
    <SkeletonLoader variant="text" width="40%" height={14} />
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b border-gray-800">
    {Array.from({ length: columns }, (_, i) => (
      <td key={i} className="py-3 px-4">
        <SkeletonLoader variant="text" height={16} />
      </td>
    ))}
  </tr>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="bg-sms-dark border border-gray-700 rounded-xl p-6">
    <SkeletonLoader variant="text" width="40%" height={24} className="mb-4" />
    <SkeletonLoader variant="rect" height={height} />
  </div>
);

export default SkeletonLoader;