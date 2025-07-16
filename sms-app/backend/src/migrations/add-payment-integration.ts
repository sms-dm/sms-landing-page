import { dbRun } from '../config/database.abstraction';

export async function up() {
  console.log('🔄 Adding payment integration tables...');

  // Create activation_codes table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      used_by_ip TEXT,
      max_uses INTEGER DEFAULT 1,
      current_uses INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
      
      -- Payment reference
      payment_reference TEXT,
      payment_amount DECIMAL(10,2),
      payment_currency TEXT DEFAULT 'USD',
      
      -- Metadata
      metadata TEXT DEFAULT '{}'
    )
  `);

  // Create indexes for activation_codes
  try {
    await dbRun('CREATE INDEX idx_activation_codes_code ON activation_codes(code)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_activation_codes_email ON activation_codes(email)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_activation_codes_status ON activation_codes(status)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_activation_codes_expires_at ON activation_codes(expires_at)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  // Create payment_logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS payment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activation_code_id INTEGER REFERENCES activation_codes(id),
      payment_provider TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      customer_email TEXT,
      customer_name TEXT,
      
      -- Webhook data
      webhook_received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      webhook_event_type TEXT,
      webhook_payload TEXT,
      
      -- Processing status
      processed BOOLEAN DEFAULT 0,
      processed_at DATETIME,
      processing_notes TEXT
    )
  `);

  // Create indexes for payment_logs
  try {
    await dbRun('CREATE INDEX idx_payment_logs_payment_id ON payment_logs(payment_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_payment_logs_activation_code_id ON payment_logs(activation_code_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_payment_logs_customer_email ON payment_logs(customer_email)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  // Create activation_code_usage table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_code_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activation_code_id INTEGER REFERENCES activation_codes(id),
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_by_ip TEXT,
      user_agent TEXT,
      company_id INTEGER REFERENCES companies(id),
      user_id INTEGER REFERENCES users(id)
    )
  `);

  // Create indexes for activation_code_usage
  try {
    await dbRun('CREATE INDEX idx_code_usage_activation_code_id ON activation_code_usage(activation_code_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }
  try {
    await dbRun('CREATE INDEX idx_code_usage_company_id ON activation_code_usage(company_id)');
  } catch (e: any) {
    if (!e.message.includes('already exists')) throw e;
  }

  // Create trigger to update activation code status (SQLite version)
  await dbRun(`
    CREATE TRIGGER IF NOT EXISTS update_code_status_on_usage
    AFTER INSERT ON activation_code_usage
    FOR EACH ROW
    BEGIN
      -- Update current_uses count
      UPDATE activation_codes 
      SET current_uses = (
        SELECT COUNT(*) FROM activation_code_usage 
        WHERE activation_code_id = NEW.activation_code_id
      )
      WHERE id = NEW.activation_code_id;
      
      -- Check if code should be marked as used
      UPDATE activation_codes 
      SET status = 'used',
          used_at = NEW.used_at,
          used_by_ip = NEW.used_by_ip
      WHERE id = NEW.activation_code_id 
      AND current_uses >= max_uses
      AND status = 'active';
    END;
  `);

  console.log('✅ Payment integration tables created');
}