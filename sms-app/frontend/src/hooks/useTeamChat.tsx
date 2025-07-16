import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from './useWebSocket';
import toast from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  timestamp: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  isRead?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'team' | 'department' | 'direct';
  participants: number[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface TypingUser {
  userId: number;
  userName: string;
  channelId: string;
}

export interface OnlineUser {
  userId: number;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

export const useTeamChat = () => {
  const { user } = useAuth();
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Get channels based on user role
  const getDefaultChannels = useCallback((): ChatChannel[] => {
    if (!user) return [];

    const defaultChannels: ChatChannel[] = [];

    // Add department-specific channels
    switch (user.role) {
      case 'electrical_manager':
      case 'technician':
        defaultChannels.push({
          id: 'electrical-team',
          name: 'Electrical Team',
          type: 'department',
          participants: [],
          unreadCount: 0
        });
        break;
      case 'mechanical_manager':
      case 'mechanic':
        defaultChannels.push({
          id: 'mechanical-team',
          name: 'Mechanical Team',
          type: 'department',
          participants: [],
          unreadCount: 0
        });
        break;
      case 'hse':
      case 'hse_manager':
        defaultChannels.push({
          id: 'hse-team',
          name: 'HSE Team',
          type: 'department',
          participants: [],
          unreadCount: 0
        });
        break;
      case 'manager':
      case 'admin':
        defaultChannels.push(
          {
            id: 'management',
            name: 'Management',
            type: 'team',
            participants: [],
            unreadCount: 0
          },
          {
            id: 'all-departments',
            name: 'All Departments',
            type: 'team',
            participants: [],
            unreadCount: 0
          }
        );
        break;
    }

    // Add general channel for all users
    defaultChannels.push({
      id: 'general',
      name: 'General',
      type: 'team',
      participants: [],
      unreadCount: 0
    });

    return defaultChannels;
  }, [user]);

  // Initialize channels
  useEffect(() => {
    const defaultChannels = getDefaultChannels();
    setChannels(defaultChannels);
    if (defaultChannels.length > 0 && !activeChannel) {
      setActiveChannel(defaultChannels[0].id);
    }
    setLoading(false);
  }, [getDefaultChannels, activeChannel]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'new_message':
        handleNewMessage(lastMessage.payload);
        break;
      case 'typing_start':
        handleTypingStart(lastMessage.payload);
        break;
      case 'typing_stop':
        handleTypingStop(lastMessage.payload);
        break;
      case 'user_online':
        handleUserOnline(lastMessage.payload);
        break;
      case 'user_offline':
        handleUserOffline(lastMessage.payload);
        break;
      case 'message_history':
        handleMessageHistory(lastMessage.payload);
        break;
    }
  }, [lastMessage]);

  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => ({
      ...prev,
      [message.channelId]: [...(prev[message.channelId] || []), message]
    }));

    // Update channel unread count if not active channel
    if (message.channelId !== activeChannel && message.userId !== user?.id) {
      setChannels(prev => prev.map(channel => 
        channel.id === message.channelId
          ? { ...channel, unreadCount: channel.unreadCount + 1, lastMessage: message }
          : channel
      ));

      // Show notification
      toast(
        <div className="flex items-center">
          <div className="flex-1">
            <p className="font-semibold">{message.userName}</p>
            <p className="text-sm">{message.content}</p>
          </div>
        </div>,
        {
          duration: 4000,
          position: 'bottom-right',
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151'
          }
        }
      );
    }
  };

  const handleTypingStart = ({ userId, userName, channelId }: TypingUser) => {
    setTypingUsers(prev => {
      const exists = prev.some(u => u.userId === userId && u.channelId === channelId);
      if (!exists) {
        return [...prev, { userId, userName, channelId }];
      }
      return prev;
    });
  };

  const handleTypingStop = ({ userId, channelId }: { userId: number; channelId: string }) => {
    setTypingUsers(prev => prev.filter(u => !(u.userId === userId && u.channelId === channelId)));
  };

  const handleUserOnline = (user: OnlineUser) => {
    setOnlineUsers(prev => {
      const index = prev.findIndex(u => u.userId === user.userId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = user;
        return updated;
      }
      return [...prev, user];
    });
  };

  const handleUserOffline = ({ userId }: { userId: number }) => {
    setOnlineUsers(prev => prev.map(u => 
      u.userId === userId ? { ...u, status: 'offline' as const, lastSeen: new Date().toISOString() } : u
    ));
  };

  const handleMessageHistory = ({ channelId, messages: history }: { channelId: string; messages: ChatMessage[] }) => {
    setMessages(prev => ({
      ...prev,
      [channelId]: history
    }));
  };

  // Send a message
  const sendChatMessage = useCallback((content: string, attachments?: File[]) => {
    if (!activeChannel || !user || !content.trim()) return;

    const message: ChatMessage = {
      id: `temp-${Date.now()}`,
      channelId: activeChannel,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      content,
      timestamp: new Date().toISOString(),
      attachments: []
    };

    // Optimistically add message
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), message]
    }));

    // Send via WebSocket
    sendMessage({
      type: 'send_message',
      payload: {
        channelId: activeChannel,
        content,
        attachments: attachments?.map(f => f.name) || []
      }
    });
  }, [activeChannel, user, sendMessage]);

  // Mark channel as read
  const markChannelAsRead = useCallback((channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, unreadCount: 0 } : channel
    ));

    sendMessage({
      type: 'mark_read',
      payload: { channelId }
    });
  }, [sendMessage]);

  // Change active channel
  const changeChannel = useCallback((channelId: string) => {
    setActiveChannel(channelId);
    markChannelAsRead(channelId);

    // Request message history
    sendMessage({
      type: 'get_history',
      payload: { channelId }
    });
  }, [markChannelAsRead, sendMessage]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!activeChannel || !user) return;

    sendMessage({
      type: 'typing_start',
      payload: {
        channelId: activeChannel,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`
      }
    });
  }, [activeChannel, user, sendMessage]);

  const stopTyping = useCallback(() => {
    if (!activeChannel || !user) return;

    sendMessage({
      type: 'typing_stop',
      payload: {
        channelId: activeChannel,
        userId: user.id
      }
    });
  }, [activeChannel, user, sendMessage]);

  return {
    isConnected,
    channels,
    messages: messages[activeChannel || ''] || [],
    activeChannel,
    typingUsers: typingUsers.filter(u => u.channelId === activeChannel),
    onlineUsers,
    loading,
    sendMessage: sendChatMessage,
    changeChannel,
    startTyping,
    stopTyping,
    markChannelAsRead
  };
};