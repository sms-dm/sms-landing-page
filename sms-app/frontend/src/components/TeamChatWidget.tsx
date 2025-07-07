import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import TeamChat from './TeamChat';
import { useTeamChat } from '../hooks/useTeamChat';

interface TeamChatWidgetProps {
  defaultOpen?: boolean;
  defaultMinimized?: boolean;
}

const TeamChatWidget: React.FC<TeamChatWidgetProps> = ({
  defaultOpen = false,
  defaultMinimized = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [hasUnread, setHasUnread] = useState(false);
  const { channels } = useTeamChat();

  // Check for unread messages
  useEffect(() => {
    const unreadCount = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);
    setHasUnread(unreadCount > 0);
  }, [channels]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('sms_chat_open', isOpen.toString());
    localStorage.setItem('sms_chat_minimized', isMinimized.toString());
  }, [isOpen, isMinimized]);

  // Load state from localStorage
  useEffect(() => {
    const savedOpen = localStorage.getItem('sms_chat_open');
    const savedMinimized = localStorage.getItem('sms_chat_minimized');
    
    if (savedOpen !== null) {
      setIsOpen(savedOpen === 'true');
    }
    if (savedMinimized !== null) {
      setIsMinimized(savedMinimized === 'true');
    }
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-sms-cyan hover:bg-sms-cyan/80 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 group"
      >
        <FiMessageSquare className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Open Team Chat
        </span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-sms-dark border border-gray-700 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center space-x-2 text-white hover:text-sms-cyan transition-colors"
          >
            <FiMessageSquare className="w-5 h-5" />
            <span className="text-sm font-semibold">Team Chat</span>
            {hasUnread && (
              <span className="bg-sms-cyan text-xs text-sms-dark px-1.5 py-0.5 rounded-full">
                {channels.reduce((sum, channel) => sum + channel.unreadCount, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-700 rounded transition-colors ml-4"
          >
            <FiX className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <TeamChat
      isFloating={true}
      isMinimized={isMinimized}
      onClose={() => setIsOpen(false)}
      onMinimize={() => setIsMinimized(true)}
      onMaximize={() => {
        // Could implement full-screen mode here
        console.log('Maximize chat');
      }}
    />
  );
};

export default TeamChatWidget;