import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { channelAccessMiddleware, canCreateChannelMiddleware } from '../middleware/channelAccess.middleware';
import { ChannelsController } from '../controllers/channels.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all channels for the authenticated user
router.get('/', ChannelsController.getChannels);

// Get channel details by ID
router.get('/:channelId', 
  channelAccessMiddleware(),
  ChannelsController.getChannelById
);

// Note: Get messages for a channel is now in messages.routes.ts

// Create a new channel
router.post('/', 
  canCreateChannelMiddleware,
  ChannelsController.createChannel
);

// Update channel
router.put('/:channelId', 
  channelAccessMiddleware('admin'),
  ChannelsController.updateChannel
);

// Add members to channel
router.post('/:channelId/members', 
  channelAccessMiddleware('admin'),
  ChannelsController.addMembers
);

// Remove member from channel
router.delete('/:channelId/members/:userId', 
  channelAccessMiddleware(),
  ChannelsController.removeMember
);

// Update member role
router.put('/:channelId/members/:userId/role', 
  channelAccessMiddleware('admin'),
  ChannelsController.updateMemberRole
);

// Archive channel
router.delete('/:channelId', 
  channelAccessMiddleware('admin'),
  ChannelsController.archiveChannel
);

// Search channels
router.get('/search', ChannelsController.searchChannels);

export default router;