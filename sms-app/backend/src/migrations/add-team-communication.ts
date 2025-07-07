import { readFileSync } from 'fs';
import { join } from 'path';
import { dbRun } from '../config/database.abstraction';

export const addTeamCommunication = async () => {
  console.log('🔄 Running migration: Adding team communication and HSE board schema...');

  try {
    // Read the SQL migration file
    const sqlPath = join(__dirname, '002_add_team_communication_schema.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Split the SQL content by semicolons to execute statements individually
    const statements = sqlContent
      .split(/;\s*$|;\s*\n/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbRun(statement + ';');
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        } catch (error: any) {
          // Log errors but continue - some constraints might already exist
          if (error.message.includes('already exists')) {
            console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            throw error;
          }
        }
      }
    }

    console.log('✅ Team communication and HSE board migration completed successfully');

    // Create default channels for existing vessels
    await createDefaultChannels();

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Helper function to create default channels for existing vessels
async function createDefaultChannels() {
  console.log('🔄 Creating default channels for existing vessels...');

  try {
    // Get the first admin user for creating system channels
    const adminResult = await dbRun(`
      SELECT id FROM users 
      WHERE role = 'admin' 
      ORDER BY id 
      LIMIT 1
    `);
    
    if (!adminResult || !adminResult.id) {
      console.log('⚠️  No admin user found, skipping default channel creation');
      return;
    }

    const adminId = adminResult.id;

    // Create fleet-wide channels if they don't exist
    await dbRun(`
      INSERT INTO channels (name, channel_type, description, created_by)
      VALUES 
      ('Fleet HSE Updates', 'hse', 'Company-wide HSE announcements and safety updates', $1),
      ('Fleet Announcements', 'announcement', 'General fleet-wide announcements and news', $1)
      ON CONFLICT (vessel_id, department, channel_type) DO NOTHING
    `, [adminId]).catch(() => console.log('Fleet channels already exist'));

    // Get all vessels
    const vessels = await dbRun(`SELECT id, name FROM vessels WHERE is_active = true`);
    
    if (!vessels || !Array.isArray(vessels)) {
      console.log('No active vessels found');
      return;
    }

    // Create default team channels for each vessel
    const departments = ['electrical', 'mechanical', 'deck', 'engine', 'safety'];
    
    for (const vessel of vessels) {
      for (const dept of departments) {
        const channelName = `${dept}-team-${vessel.id}`;
        const description = `${dept.charAt(0).toUpperCase() + dept.slice(1)} team communication for ${vessel.name}`;
        
        await dbRun(`
          INSERT INTO channels (name, channel_type, vessel_id, department, description, created_by)
          VALUES ($1, 'team', $2, $3, $4, $5)
          ON CONFLICT (vessel_id, department, channel_type) DO NOTHING
        `, [channelName, vessel.id, dept, description, adminId])
          .catch(() => console.log(`Channel ${channelName} already exists`));
      }
      
      // Create vessel-wide announcement channel
      await dbRun(`
        INSERT INTO channels (name, channel_type, vessel_id, description, created_by)
        VALUES ($1, 'vessel', $2, $3, $4)
        ON CONFLICT (vessel_id, department, channel_type) DO NOTHING
      `, [`${vessel.name} Announcements`, vessel.id, `Vessel-wide announcements for ${vessel.name}`, adminId])
        .catch(() => console.log(`Vessel announcement channel for ${vessel.name} already exists`));
    }

    console.log('✅ Default channels created successfully');
  } catch (error) {
    console.error('⚠️  Error creating default channels:', error);
    // Don't throw - this is optional
  }
}

// Run the migration
if (require.main === module) {
  addTeamCommunication().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}