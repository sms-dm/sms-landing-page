import { dbRun } from './config/database';

const updateCompanyLogos = async () => {
  console.log('🎨 Updating company logos...');

  try {
    // Update all companies to use the SMS logo
    await dbRun(`
      UPDATE companies 
      SET logo_url = '/sms-logo.png',
          updated_at = CURRENT_TIMESTAMP
    `);

    console.log('✅ Company logos updated successfully');
  } catch (error) {
    console.error('❌ Failed to update logos:', error);
  }
  
  process.exit(0);
};

updateCompanyLogos();