import { dbRun } from './config/database';

const fixCompanyLogos = async () => {
  console.log('🔧 Fixing company logos...');

  try {
    // Revert all client companies to null (they'll provide their own logos)
    await dbRun(`
      UPDATE companies 
      SET logo_url = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE slug != 'sms-internal'
    `);

    // Only SMS internal portal should use the SMS logo
    await dbRun(`
      UPDATE companies 
      SET logo_url = '/sms-logo.png',
          updated_at = CURRENT_TIMESTAMP
      WHERE slug = 'sms-internal'
    `);

    console.log('✅ Company logos fixed - clients will use their own logos');
  } catch (error) {
    console.error('❌ Failed to fix logos:', error);
  }
  
  process.exit(0);
};

fixCompanyLogos();