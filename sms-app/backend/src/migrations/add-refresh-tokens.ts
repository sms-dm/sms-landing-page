import { dbRun } from '../config/database.abstraction';

export async function addRefreshTokensTable() {
  console.log('🔄 Adding refresh tokens table...');

  try {
    // Create refresh_tokens table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
      ON refresh_tokens(token)
    `);

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
      ON refresh_tokens(user_id)
    `);

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
      ON refresh_tokens(expires_at)
    `);

    console.log('✅ Refresh tokens table created successfully');
  } catch (error) {
    console.error('❌ Error creating refresh tokens table:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addRefreshTokensTable()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}