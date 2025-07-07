import React from 'react';
import TeamChat from './TeamChat';

interface TeamChatSectionProps {
  className?: string;
}

const TeamChatSection: React.FC<TeamChatSectionProps> = ({ className = '' }) => {
  return (
    <div className={`h-[600px] ${className}`}>
      <TeamChat isFloating={false} />
    </div>
  );
};

export default TeamChatSection;