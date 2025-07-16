import React from 'react';

interface TooltipProps {
  title: string;
  description: string;
  detail?: string;
  color?: 'cyan' | 'blue' | 'purple' | 'orange' | 'red' | 'amber' | 'green' | 'gray';
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const colorClasses = {
  cyan: 'border-sms-cyan/30 text-sms-cyan',
  blue: 'border-blue-500/30 text-blue-400',
  purple: 'border-purple-500/30 text-purple-400',
  orange: 'border-orange-500/30 text-orange-400',
  red: 'border-red-500/30 text-red-400',
  amber: 'border-amber-500/30 text-amber-400',
  green: 'border-green-500/30 text-green-400',
  gray: 'border-gray-600 text-gray-400',
};

const positionClasses = {
  bottom: '-bottom-16 left-1/2 transform -translate-x-1/2',
  top: '-top-16 left-1/2 transform -translate-x-1/2',
  left: 'top-1/2 -left-64 transform -translate-y-1/2',
  right: 'top-1/2 -right-64 transform -translate-y-1/2',
};

const Tooltip: React.FC<TooltipProps> = ({ 
  title, 
  description, 
  detail,
  color = 'cyan', 
  position = 'bottom' 
}) => {
  return (
    <div className={`absolute ${positionClasses[position]} bg-sms-dark border ${colorClasses[color].split(' ')[0]} rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none`}>
      <p className={`text-sm font-semibold ${colorClasses[color].split(' ')[1]}`}>{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
    </div>
  );
};

export default Tooltip;