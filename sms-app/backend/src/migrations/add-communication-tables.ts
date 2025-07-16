import { dbRun } from '../config/database.abstraction';

export async function up() {
  try {
    // Add additional columns to messages table if needed
    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES messages(id)
    `).catch(() => {
      console.log('reply_to_id column might already exist');
    });

    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false
    `).catch(() => {
      console.log('is_pinned column might already exist');
    });

    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP
    `).catch(() => {
      console.log('pinned_at column might already exist');
    });

    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_by INTEGER REFERENCES users(id)
    `).catch(() => {
      console.log('pinned_by column might already exist');
    });

    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id)
    `).catch(() => {
      console.log('deleted_by column might already exist');
    });

    await dbRun(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false
    `).catch(() => {
      console.log('is_system column might already exist');
    });

    // Create message_attachments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create message_reactions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    // Create message_mentions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS message_mentions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        mention_type VARCHAR(20) NOT NULL CHECK (mention_type IN ('user', 'special', 'text')),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        mention_value VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create hse_attachments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS hse_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hse_update_id INTEGER NOT NULL REFERENCES hse_updates(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        priority VARCHAR(20) DEFAULT 'normal',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_preferences table if not exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        notification_sound BOOLEAN DEFAULT true,
        theme VARCHAR(20) DEFAULT 'light',
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Add columns to users table if they don't exist
    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available'
    `).catch(() => {
      console.log('status column might already exist');
    });

    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message VARCHAR(255)
    `).catch(() => {
      console.log('status_message column might already exist');
    });

    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP
    `).catch(() => {
      console.log('status_updated_at column might already exist');
    });

    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS available_until TIMESTAMP
    `).catch(() => {
      console.log('available_until column might already exist');
    });

    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100)
    `).catch(() => {
      console.log('position column might already exist');
    });

    await dbRun(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT
    `).catch(() => {
      console.log('avatar_url column might already exist');
    });

    // Add understood column to hse_acknowledgments
    await dbRun(`
      ALTER TABLE hse_acknowledgments ADD COLUMN IF NOT EXISTS understood BOOLEAN DEFAULT true
    `).catch(() => {
      console.log('understood column might already exist');
    });

    // Add last_activity_at to channels
    await dbRun(`
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `).catch(() => {
      console.log('last_activity_at column might already exist');
    });

    console.log('✅ Communication tables migration completed');
  } catch (error) {
    console.error('Error in communication tables migration:', error);
    throw error;
  }
}

export async function down() {
  // Drop tables in reverse order
  await dbRun('DROP TABLE IF EXISTS message_attachments');
  await dbRun('DROP TABLE IF EXISTS message_reactions');
  await dbRun('DROP TABLE IF EXISTS message_mentions');
  await dbRun('DROP TABLE IF EXISTS hse_attachments');
  await dbRun('DROP TABLE IF EXISTS notifications');
  await dbRun('DROP TABLE IF EXISTS user_preferences');
}