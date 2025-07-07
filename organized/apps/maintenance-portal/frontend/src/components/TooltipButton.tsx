import React from 'react';

interface TooltipButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bgColor: string;
  borderColor: string;
  hoverBorderColor: string;
  textColor: string;
  tooltipTitle: string;
  tooltipDescription: string;
  tooltipBorderColor: string;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  onClick,
  icon,
  title,
  subtitle,
  bgColor,
  borderColor,
  hoverBorderColor,
  textColor,
  tooltipTitle,
  tooltipDescription,
  tooltipBorderColor,
}) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`relative overflow-hidden ${bgColor} border ${borderColor} ${hoverBorderColor} rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <div className="relative z-10">
          {icon}
          <p className={`text-white font-semibold text-sm`}>{title}</p>
          <p className={`text-xs ${textColor} mt-1`}>{subtitle}</p>
        </div>
      </button>
      <div className={`absolute -bottom-14 left-1/2 transform -translate-x-1/2 bg-sms-dark border ${tooltipBorderColor} rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none`}>
        <p className={`text-xs ${textColor} font-semibold`}>{tooltipTitle}</p>
        <p className="text-xs text-gray-400">{tooltipDescription}</p>
      </div>
    </div>
  );
};

export default TooltipButton;