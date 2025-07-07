#!/usr/bin/env node

/**
 * Database Connection Test Script for SMS Project
 * Tests connections to both PostgreSQL databases
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Helper functions
const success = (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`);

// Read credentials from database-credentials.txt
function readCredentials() {
  try {
    const credFile = path.join(__dirname, 'database-credentials.txt');
    if (!fs.existsSync(credFile)) {
      error('database-credentials.txt not found. Run setup-postgresql.sh first.');
      process.exit(1);
    }

    const content = fs.readFileSync(credFile, 'utf8');
    const maintenanceMatch = content.match(/export SMS_MAINTENANCE_DB_URL="(.+)"/);
    const onboardingMatch = content.match(/export SMS_ONBOARDING_DB_URL="(.+)"/);

    if (!maintenanceMatch || !onboardingMatch) {
      error('Could not parse database URLs from credentials file.');
      process.exit(1);
    }

    return {
      maintenance: maintenanceMatch[1],
      onboarding: onboardingMatch[1]
    };
  } catch (err) {
    error(`Error reading credentials: ${err.message}`);
    process.exit(1);
  }
}

// Test database connection
async function testConnection(name, connectionString) {
  const client = new Client({ connectionString });
  
  try {
    info(`Testing connection to ${name} database...`);
    await client.connect();
    
    // Test basic query
    const result = await client.query('SELECT current_database(), current_user, version()');
    const dbInfo = result.rows[0];
    
    success(`Connected to ${name} database`);
    console.log(`  Database: ${dbInfo.current_database}`);
    console.log(`  User: ${dbInfo.current_user}`);
    console.log(`  PostgreSQL: ${dbInfo.version.split(',')[0]}`);
    
    // Test table creation and operations
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255),
        tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(
      'INSERT INTO connection_test (test_name) VALUES ($1)',
      [`Test from ${new Date().toISOString()}`]
    );
    
    const testResult = await client.query(
      'SELECT COUNT(*) as count FROM connection_test'
    );
    
    success(`Database operations working (${testResult.rows[0].count} test records)`);
    
    // Cleanup
    await client.query('DROP TABLE IF EXISTS connection_test');
    
    return true;
  } catch (err) {
    error(`Failed to connect to ${name} database: ${err.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Main test function
async function main() {
  console.log('=== SMS Database Connection Test ===\n');
  
  // Check if pg module is installed
  try {
    require.resolve('pg');
  } catch (e) {
    error('PostgreSQL client (pg) not installed.');
    info('Install it with: npm install pg');
    process.exit(1);
  }
  
  // Read credentials
  const credentials = readCredentials();
  
  // Test both databases
  const maintenanceOk = await testConnection('Maintenance', credentials.maintenance);
  console.log(''); // Empty line for readability
  const onboardingOk = await testConnection('Onboarding', credentials.onboarding);
  
  // Summary
  console.log('\n=== Test Summary ===');
  if (maintenanceOk && onboardingOk) {
    success('All database connections successful!');
    console.log('\nYou can now use these connection strings in your applications:');
    console.log(`Maintenance: ${credentials.maintenance}`);
    console.log(`Onboarding: ${credentials.onboarding}`);
  } else {
    error('Some database connections failed.');
    console.log('\nTroubleshooting tips:');
    console.log('1. Ensure PostgreSQL is running: sudo systemctl status postgresql');
    console.log('2. Check PostgreSQL logs: sudo journalctl -u postgresql');
    console.log('3. Verify user exists: sudo -u postgres psql -c "\\du"');
    console.log('4. Re-run setup script: ./setup-postgresql.sh');
  }
}

// Run tests
main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});