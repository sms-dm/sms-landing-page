import React, { useState, useRef, useEffect } from 'react';
import {
  FiMessageSquare, FiSend, FiPaperclip, FiMoreVertical,
  FiX, FiMinimize2, FiMaximize2, FiUser, FiUsers,
  FiCircle, FiHash, FiLock, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTeamChat } from '../hooks/useTeamChat';
import { format, isToday, isYesterday } from 'date-fns';
import { canPostInChannel, canReadChannel, PermissionService } from '../utils/permissions';
import Tooltip from './Tooltip';

interface TeamChatProps {
  isFloating?: boolean;
  isMinimized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const TeamChat: React.FC<TeamChatProps> = ({
  isFloating = false,
  isMinimized = false,
  onClose,
  onMinimize,
  onMaximize
}) => {
  const { user } = useAuth();
  const {
    isConnected,
    channels,
    messages,
    activeChannel,
    typingUsers,
    onlineUsers,
    loading,
    sendMessage,
    changeChannel,
    startTyping,
    stopTyping
  } = useTeamChat();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    sendMessage(messageInput);
    setMessageInput('');
    
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'department':
        return <FiUsers className="w-4 h-4" />;
      case 'direct':
        return <FiUser className="w-4 h-4" />;
      case 'team':
      default:
        return <FiHash className="w-4 h-4" />;
    }
  };

  const getUserStatus = (userId: number) => {
    const user = onlineUsers.find(u => u.userId === userId);
    return user?.status || 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'away':
        return 'text-amber-400';
      default:
        return 'text-gray-500';
    }
  };

  if (isMinimized) return null;

  const containerClasses = isFloating
    ? 'fixed bottom-4 right-4 w-96 h-[600px] bg-sms-dark border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50'
    : 'h-full bg-sms-dark/60 backdrop-blur-sm border border-gray-700 rounded-xl flex flex-col';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-sms-dark/80 border-b border-gray-700 rounded-t-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiMessageSquare className="w-5 h-5 text-sms-cyan" />
          <h3 className="font-semibold text-white">Team Chat</h3>
          {!isConnected && (
            <span className="text-xs text-red-400 ml-2">Disconnected</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isFloating && onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <FiMinimize2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {isFloating && onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <FiMaximize2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <FiX className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Channel List */}
        <div className="w-1/3 bg-gray-800/50 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <p className="text-xs text-gray-400 uppercase font-semibold">Channels</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => changeChannel(channel.id)}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                  activeChannel === channel.id ? 'bg-gray-700/50 border-l-2 border-sms-cyan' : ''
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={activeChannel === channel.id ? 'text-sms-cyan' : 'text-gray-400'}>
                    {getChannelIcon(channel.type)}
                  </span>
                  <span className="text-sm text-white truncate">{channel.name}</span>
                </div>
                {channel.unreadCount > 0 && (
                  <span className="bg-sms-cyan text-xs text-sms-dark px-1.5 py-0.5 rounded-full">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-sms-cyan rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.userId === user?.id
                        ? 'bg-sms-cyan/20 border-sms-cyan/30'
                        : 'bg-gray-700/50 border-gray-600'
                    } border rounded-lg px-3 py-2`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-white">
                        {message.userName}
                      </span>
                      <FiCircle className={`w-2 h-2 ${getStatusColor(getUserStatus(message.userId))}`} />
                      <span className="text-xs text-gray-400">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.content}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-xs text-sms-cyan hover:text-sms-cyan/80"
                          >
                            <FiPaperclip className="w-3 h-3" />
                            <span>{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>
                  {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-3">
            {activeChannel && user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiPaperclip className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    // Handle file upload
                    console.log('Files selected:', e.target.files);
                  }}
                />
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sms-cyan"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`p-2 rounded-lg transition-colors ${
                    messageInput.trim()
                      ? 'bg-sms-cyan hover:bg-sms-cyan/80 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-gray-400 py-2">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  {user?.role === 'technician' 
                    ? `You can only post in your ${user.department} department channel`
                    : `You don't have permission to post in this channel`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;