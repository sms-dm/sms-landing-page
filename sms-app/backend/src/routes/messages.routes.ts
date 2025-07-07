import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { channelAccessMiddleware } from '../middleware/channelAccess.middleware';
import { 
  canPostInChannelMiddleware, 
  canReadChannelMiddleware,
  canEditMessageMiddleware 
} from '../middleware/permissions.middleware';
import { MessagesController } from '../controllers/messages.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Send a message to a channel - now with strict permission check
router.post('/send', 
  canPostInChannelMiddleware,
  MessagesController.sendMessage
);

// Get messages for a channel - verify read permissions
router.get('/channel/:channelId', 
  canReadChannelMiddleware,
  MessagesController.getChannelMessages
);

// Edit a message - check if user can edit
router.put('/:messageId', 
  canEditMessageMiddleware,
  MessagesController.editMessage
);

// Delete a message - check if user can delete
router.delete('/:messageId', 
  canEditMessageMiddleware,
  MessagesController.deleteMessage
);

// Pin/unpin a message
router.post('/:messageId/pin', 
  channelAccessMiddleware('moderator'),
  MessagesController.togglePinMessage
);

// Add reaction to message
router.post('/:messageId/reactions', MessagesController.addReaction);

// Remove reaction from message
router.delete('/:messageId/reactions', MessagesController.removeReaction);

// Search messages
router.get('/search', MessagesController.searchMessages);

// Get message thread
router.get('/:messageId/thread', MessagesController.getThreadMessages);

export default router;