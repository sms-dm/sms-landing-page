// Utility functions for criticality display

export type Criticality = 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
export type CriticalityDisplay = 'CRITICAL' | 'MAJOR' | 'MINOR';

// Map database values to display values
export const mapCriticalityLabel = (criticality: Criticality | undefined | null): CriticalityDisplay => {
  switch (criticality) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'IMPORTANT':
      return 'MAJOR';
    case 'STANDARD':
      return 'MINOR';
    default:
      return 'MINOR'; // Default to MINOR if not specified
  }
};

// Get color class for criticality
export const getCriticalityColor = (criticality: Criticality | undefined | null): string => {
  switch (criticality) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-100';
    case 'IMPORTANT':
      return 'text-yellow-600 bg-yellow-100';
    case 'STANDARD':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Get badge styles for criticality
export const getCriticalityBadgeClass = (criticality: Criticality | undefined | null): string => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  const colorClasses = getCriticalityColor(criticality);
  return `${baseClasses} ${colorClasses}`;
};

// For fault types (keeping existing functionality)
export const getFaultTypeColor = (faultType: 'critical' | 'minor'): string => {
  return faultType === 'critical' 
    ? 'text-red-600 bg-red-100' 
    : 'text-yellow-600 bg-yellow-100';
};

export const getFaultTypeBadgeClass = (faultType: 'critical' | 'minor'): string => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  const colorClasses = getFaultTypeColor(faultType);
  return `${baseClasses} ${colorClasses}`;
};