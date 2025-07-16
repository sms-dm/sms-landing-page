// Socket.io event types for type-safe communication

export interface ServerToClientEvents {
  // Message events
  'message:new': (message: MessageData) => void;
  'message:edited': (data: { messageId: number; content: string; editedAt: Date }) => void;
  'message:deleted': (data: { messageId: number }) => void;
  
  // Typing indicators
  'typing:user': (data: {
    channelId: number;
    userId: number;
    userName: string;
    isTyping: boolean;
  }) => void;
  
  // HSE events
  'hse:newAlert': (alert: HSEUpdateData) => void;
  'hse:acknowledged': (data: { updateId: number }) => void;
  'hse:userAcknowledged': (data: {
    updateId: number;
    userId: number;
    userName: string;
    acknowledgedAt: Date;
  }) => void;
  
  // Channel events
  'channel:joined': (data: { channelId: number }) => void;
  'channel:left': (data: { channelId: number }) => void;
  
  // Presence events
  'presence:update': (data: {
    userId: number;
    userEmail: string;
    userName: string;
    isOnline: boolean;
    lastSeen: Date;
  }) => void;
  
  // Message read receipts
  'messages:markedRead': (data: { channelId: number; messageIds: number[] }) => void;
  
  // Error events
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Message events
  'message:send': (data: {
    channelId: number;
    content: string;
    messageType?: 'text' | 'file' | 'image' | 'system' | 'hse_update';
    metadata?: any;
  }) => void;
  'message:edit': (data: { messageId: number; content: string }) => void;
  'message:delete': (data: { messageId: number }) => void;
  
  // Typing indicators
  'typing:start': (data: { channelId: number; isTyping: boolean }) => void;
  'typing:stop': (data: { channelId: number; isTyping: boolean }) => void;
  
  // HSE events
  'hse:alert': (data: {
    title: string;
    content: string;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    scope: 'fleet' | 'vessel' | 'department';
    vesselId?: number;
    department?: string;
  }) => void;
  'hse:acknowledge': (data: { updateId: number; comments?: string }) => void;
  
  // Channel management
  'channel:join': (channelId: number) => void;
  'channel:leave': (channelId: number) => void;
  
  // Mark messages as read
  'messages:markRead': (data: { channelId: number; messageIds: number[] }) => void;
}

export interface MessageData {
  id: number;
  channel_id: number;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system' | 'hse_update';
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  parent_message_id: number | null;
  created_at: string;
  metadata: any;
  is_read?: boolean;
}

export interface HSEUpdateData {
  id: number;
  title: string;
  content: string;
  update_type: 'safety_alert' | 'procedure_update' | 'incident_report' | 'best_practice' | 'regulatory_update' | 'training';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scope: 'fleet' | 'vessel' | 'department';
  vessel_id: number | null;
  vessel_name?: string;
  department: string | null;
  requires_acknowledgment: boolean;
  acknowledgment_deadline: string | null;
  is_active: boolean;
  created_by: number;
  creator_name: string;
  creator_email: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  tags: string[] | null;
  is_acknowledged?: boolean;
}

export interface ChannelData {
  id: number;
  name: string;
  channel_type: 'team' | 'vessel' | 'direct' | 'hse' | 'announcement';
  vessel_id: number | null;
  vessel_name?: string;
  department: string | null;
  description: string | null;
  is_active: boolean;
  is_private: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  user_role?: string;
  last_read_at?: string;
  notifications_enabled?: boolean;
  unread_count?: number;
  members?: ChannelMember[];
  memberCount?: number;
}

export interface ChannelMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  channel_role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  is_online: boolean;
}