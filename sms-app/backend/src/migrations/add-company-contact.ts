import { dbRun, dbGet, dbAll } from '../config/database';

export const addCompanyContact = async () => {
  try {
    // Check if columns already exist
    const tableInfo = await dbAll(
      "PRAGMA table_info(companies)"
    ) as Array<{ name: string }>;

    const existingColumns = tableInfo.map(col => col.name);
    
    if (!existingColumns.includes('contact_email')) {
      console.log('📧 Adding contact fields to companies table...');

      // Add contact_email column
      await dbRun(`
        ALTER TABLE companies 
        ADD COLUMN contact_email TEXT
      `);

      // Add contact_name column
      await dbRun(`
        ALTER TABLE companies 
        ADD COLUMN contact_name TEXT
      `);

      // Add contact_phone column
      await dbRun(`
        ALTER TABLE companies 
        ADD COLUMN contact_phone TEXT
      `);

      // Update existing demo companies with contact info
      await dbRun(`
        UPDATE companies 
        SET contact_email = 'demo.admin@oceanic.com',
            contact_name = 'System Admin',
            contact_phone = '+1 (555) 123-4567'
        WHERE slug = 'oceanic'
      `);

      await dbRun(`
        UPDATE companies 
        SET contact_email = 'admin@geoquip.com',
            contact_name = 'Geoquip Admin',
            contact_phone = '+1 (555) 987-6543'
        WHERE slug = 'geoquip'
      `);

      console.log('✅ Company contact fields added successfully');
    } else {
      console.log('ℹ️  Company contact fields already exist');
    }

  } catch (error) {
    console.error('❌ Error adding company contact fields:', error);
    throw error;
  }
};