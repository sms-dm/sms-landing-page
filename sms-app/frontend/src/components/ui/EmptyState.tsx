import React from 'react';
import { FiInbox, FiPackage, FiUsers, FiFileText, FiAlertCircle } from 'react-icons/fi';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'inbox' | 'package' | 'users' | 'file' | 'alert' | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  action,
  className = '',
}) => {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconProps = { className: 'w-16 h-16 text-gray-600 mb-4' };
    
    switch (icon) {
      case 'package':
        return <FiPackage {...iconProps} />;
      case 'users':
        return <FiUsers {...iconProps} />;
      case 'file':
        return <FiFileText {...iconProps} />;
      case 'alert':
        return <FiAlertCircle {...iconProps} />;
      case 'inbox':
      default:
        return <FiInbox {...iconProps} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}>
      {getIcon()}
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-400 text-sm text-center mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-sms-cyan hover:bg-sms-cyan/80 text-white font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured empty states for common use cases
export const NoDataState: React.FC<{ message?: string }> = ({ message = 'No data available' }) => (
  <EmptyState
    title={message}
    description="Data will appear here once it's available"
    icon="inbox"
  />
);

export const NoFaultsState: React.FC<{ onReport?: () => void }> = ({ onReport }) => (
  <EmptyState
    title="No Active Faults"
    description="Great news! There are no active faults to display."
    icon="alert"
    action={onReport ? { label: 'Report New Fault', onClick: onReport } : undefined}
  />
);

export const NoInventoryState: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
  <EmptyState
    title="No Inventory Items"
    description="Start by adding inventory items to track your parts and supplies."
    icon="package"
    action={onAdd ? { label: 'Add Inventory Item', onClick: onAdd } : undefined}
  />
);

export const NoRecordsState: React.FC = () => (
  <EmptyState
    title="No Records Found"
    description="Records will appear here as maintenance activities are completed."
    icon="file"
  />
);

export const NoTeamMembersState: React.FC<{ onInvite?: () => void }> = ({ onInvite }) => (
  <EmptyState
    title="No Team Members"
    description="Add team members to collaborate on maintenance tasks."
    icon="users"
    action={onInvite ? { label: 'Invite Team Members', onClick: onInvite } : undefined}
  />
);

export default EmptyState;