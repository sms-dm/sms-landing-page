/**
 * Permission system for team communication
 * Controls who can post where based on role and channel type
 */

export type UserRole = 'technician' | 'manager' | 'admin' | 'hse' | 'hse_manager' | 'electrical_manager' | 'mechanical_manager';
export type ChannelType = 'team' | 'vessel' | 'direct' | 'hse' | 'announcement' | 'department' | 'management';
export type Department = 'electrical' | 'mechanical' | 'hse' | 'management';

export interface User {
  id: number;
  role: UserRole;
  department?: Department;
  vessel_id?: number;
}

export interface Channel {
  id: number;
  channel_type: ChannelType;
  department?: Department;
  vessel_id?: number;
  is_private?: boolean;
}

export interface HSEUpdate {
  scope: 'fleet' | 'vessel' | 'department';
  vessel_id?: number;
  department?: Department;
}

/**
 * Permission Matrix
 * 
 * Electrical/Mechanical Managers:
 * - Can post in their team channels (electrical/mechanical)
 * - Can post in management channels
 * - Can read all channels
 * 
 * Technicians:
 * - Can post ONLY in their department channel
 * - Can read their department channel and announcements
 * 
 * HSE Managers:
 * - Can create fleet-wide HSE updates
 * - Can post in HSE channels
 * - Can read all channels
 * 
 * HSE Officers:
 * - Can create vessel-specific HSE updates
 * - Can post in vessel HSE channels
 * - Can read vessel channels
 * 
 * All users:
 * - Can read and acknowledge HSE updates
 * - Can participate in direct messages
 */

export class PermissionService {
  /**
   * Check if user can post in a specific channel
   */
  static canPostInChannel(user: User, channel: Channel): boolean {
    // Everyone can post in direct messages
    if (channel.channel_type === 'direct') {
      return true;
    }

    // Admin can post anywhere
    if (user.role === 'admin') {
      return true;
    }

    switch (user.role) {
      case 'electrical_manager':
      case 'mechanical_manager':
        // Managers can post in their department channels
        if (channel.channel_type === 'department' && 
            channel.department === user.department) {
          return true;
        }
        // Managers can post in management channels
        if (channel.channel_type === 'management') {
          return true;
        }
        // Managers can post in vessel-wide channels if they belong to that vessel
        if (channel.channel_type === 'vessel' && 
            channel.vessel_id === user.vessel_id) {
          return true;
        }
        return false;

      case 'technician':
        // Technicians can ONLY post in their department channel
        return channel.channel_type === 'department' && 
               channel.department === user.department;

      case 'hse_manager':
        // HSE managers can post in any HSE channel
        return channel.channel_type === 'hse';

      case 'hse':
        // HSE officers can post in vessel HSE channels
        return channel.channel_type === 'hse' && 
               channel.vessel_id === user.vessel_id;

      case 'manager':
        // General managers can post in management and vessel channels
        return channel.channel_type === 'management' ||
               (channel.channel_type === 'vessel' && channel.vessel_id === user.vessel_id);

      default:
        return false;
    }
  }

  /**
   * Check if user can create HSE updates
   */
  static canCreateHSEUpdate(user: User, scope: 'fleet' | 'vessel' | 'department'): boolean {
    switch (user.role) {
      case 'admin':
        return true; // Admin can create any HSE update

      case 'hse_manager':
        return true; // HSE managers can create any scope

      case 'hse':
        // HSE officers can only create vessel-specific updates
        return scope === 'vessel';

      default:
        return false;
    }
  }

  /**
   * Check if user can acknowledge HSE updates
   * ALL users can acknowledge HSE updates they have access to
   */
  static canAcknowledgeHSEUpdate(user: User, hseUpdate: HSEUpdate): boolean {
    // Check if user has access to the HSE update based on scope
    if (hseUpdate.scope === 'fleet') {
      return true; // Everyone can see fleet-wide updates
    }

    if (hseUpdate.scope === 'vessel') {
      return user.vessel_id === hseUpdate.vessel_id;
    }

    if (hseUpdate.scope === 'department') {
      return user.department === hseUpdate.department;
    }

    return false;
  }

  /**
   * Check if user can create channels
   */
  static canCreateChannel(user: User, channelType: ChannelType): boolean {
    // Anyone can create direct message channels
    if (channelType === 'direct') {
      return true;
    }

    switch (user.role) {
      case 'admin':
        return true; // Admin can create any channel

      case 'electrical_manager':
      case 'mechanical_manager':
        // Department managers can create department channels
        return channelType === 'department' || channelType === 'team';

      case 'hse_manager':
        // HSE managers can create HSE channels
        return channelType === 'hse';

      case 'manager':
        // General managers can create vessel and announcement channels
        return channelType === 'vessel' || channelType === 'announcement';

      default:
        return false;
    }
  }

  /**
   * Check if user can read channel
   */
  static canReadChannel(user: User, channel: Channel): boolean {
    // Everyone can read direct messages they're part of
    if (channel.channel_type === 'direct') {
      return true; // Note: actual membership check should be done elsewhere
    }

    // Everyone can read announcements
    if (channel.channel_type === 'announcement') {
      return true;
    }

    // Admin and managers can read all channels
    if (['admin', 'manager', 'electrical_manager', 'mechanical_manager', 'hse_manager'].includes(user.role)) {
      return true;
    }

    switch (channel.channel_type) {
      case 'department':
        // Users can read their own department channels
        return channel.department === user.department;

      case 'vessel':
        // Users can read channels for their vessel
        return channel.vessel_id === user.vessel_id;

      case 'hse':
        // Everyone can read HSE channels for awareness
        return true;

      case 'management':
        // Only managers can read management channels
        return false;

      default:
        return false;
    }
  }

  /**
   * Get channels user can post in
   */
  static getPostableChannels(user: User, allChannels: Channel[]): Channel[] {
    return allChannels.filter(channel => this.canPostInChannel(user, channel));
  }

  /**
   * Get channels user can read
   */
  static getReadableChannels(user: User, allChannels: Channel[]): Channel[] {
    return allChannels.filter(channel => this.canReadChannel(user, channel));
  }

  /**
   * Check if user can edit/delete a message
   */
  static canEditMessage(user: User, messageAuthorId: number): boolean {
    // Users can edit their own messages
    if (user.id === messageAuthorId) {
      return true;
    }

    // Admins can edit any message
    return user.role === 'admin';
  }

  /**
   * Check if user can moderate channel (delete messages, kick users)
   */
  static canModerateChannel(user: User, channel: Channel): boolean {
    // Admin can moderate any channel
    if (user.role === 'admin') {
      return true;
    }

    // Department managers can moderate their department channels
    if ((user.role === 'electrical_manager' || user.role === 'mechanical_manager') &&
        channel.channel_type === 'department' &&
        channel.department === user.department) {
      return true;
    }

    // HSE managers can moderate HSE channels
    if (user.role === 'hse_manager' && channel.channel_type === 'hse') {
      return true;
    }

    return false;
  }

  /**
   * Get permission summary for UI display
   */
  static getPermissionSummary(user: User): string[] {
    const permissions: string[] = [];

    switch (user.role) {
      case 'admin':
        permissions.push('Full system access');
        permissions.push('Can post in all channels');
        permissions.push('Can create any HSE update');
        permissions.push('Can moderate all channels');
        break;

      case 'electrical_manager':
      case 'mechanical_manager':
        permissions.push(`Can post in ${user.department} team channels`);
        permissions.push('Can post in management channels');
        permissions.push('Can read all channels');
        permissions.push(`Can moderate ${user.department} channels`);
        break;

      case 'technician':
        permissions.push(`Can post ONLY in ${user.department} department channel`);
        permissions.push('Can read department announcements');
        permissions.push('Can acknowledge HSE updates');
        break;

      case 'hse_manager':
        permissions.push('Can create fleet-wide HSE updates');
        permissions.push('Can post in all HSE channels');
        permissions.push('Can read all channels');
        permissions.push('Can moderate HSE channels');
        break;

      case 'hse':
        permissions.push('Can create vessel-specific HSE updates');
        permissions.push('Can post in vessel HSE channels');
        permissions.push('Can read vessel channels');
        break;

      case 'manager':
        permissions.push('Can post in management channels');
        permissions.push('Can post in vessel channels');
        permissions.push('Can create announcements');
        permissions.push('Can read all channels');
        break;
    }

    return permissions;
  }
}

// Export convenience functions
export const canPostInChannel = PermissionService.canPostInChannel;
export const canCreateHSEUpdate = PermissionService.canCreateHSEUpdate;
export const canAcknowledgeHSEUpdate = PermissionService.canAcknowledgeHSEUpdate;
export const canCreateChannel = PermissionService.canCreateChannel;
export const canReadChannel = PermissionService.canReadChannel;
export const canEditMessage = PermissionService.canEditMessage;
export const canModerateChannel = PermissionService.canModerateChannel;
export const getPermissionSummary = PermissionService.getPermissionSummary;