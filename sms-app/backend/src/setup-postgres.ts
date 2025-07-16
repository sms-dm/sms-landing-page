#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

async function setupPostgreSQL() {
  console.log('🚀 Setting up PostgreSQL for SMS Maintenance Portal...\n');

  // Parse database URL or use individual settings
  const databaseUrl = process.env.DATABASE_URL || 
    `postgresql://${process.env.PG_USER || 'sms_user'}:${process.env.PG_PASSWORD || 'sms_pass'}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE || 'sms_db'}`;
  
  const urlParts = new URL(databaseUrl);
  const dbConfig = {
    host: urlParts.hostname,
    port: parseInt(urlParts.port || '5432'),
    database: urlParts.pathname.slice(1),
    user: urlParts.username,
    password: urlParts.password
  };

  console.log(`📍 Database: ${dbConfig.database}`);
  console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`📍 User: ${dbConfig.user}\n`);

  // Step 1: Check if PostgreSQL is installed
  try {
    await execAsync('psql --version');
    console.log('✅ PostgreSQL is installed');
  } catch (error) {
    console.error('❌ PostgreSQL is not installed or not in PATH');
    console.log('\nPlease install PostgreSQL:');
    console.log('- Ubuntu/Debian: sudo apt install postgresql postgresql-contrib');
    console.log('- macOS: brew install postgresql');
    console.log('- Windows: Download from https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  // Step 2: Create database and user (using postgres superuser)
  console.log('\n📝 Creating database and user...');
  
  const adminCommands = `
CREATE USER ${dbConfig.user} WITH PASSWORD '${dbConfig.password}';
CREATE DATABASE ${dbConfig.database} OWNER ${dbConfig.user};
GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.user};
  `.trim();

  try {
    // Try to connect as postgres user
    const { stdout, stderr } = await execAsync(
      `psql -U postgres -h ${dbConfig.host} -p ${dbConfig.port} -c "${adminCommands.replace(/\n/g, ' ')}"`,
      { env: { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD || 'postgres' } }
    );
    
    if (stderr && !stderr.includes('already exists')) {
      console.error('Warning:', stderr);
    }
    console.log('✅ Database and user created successfully');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Database/user already exists');
    } else {
      console.error('⚠️  Could not create database/user automatically');
      console.log('\nPlease run these commands manually as PostgreSQL superuser:');
      console.log('```sql');
      console.log(adminCommands);
      console.log('```\n');
    }
  }

  // Step 3: Test connection
  console.log('\n🔌 Testing database connection...');
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Successfully connected to PostgreSQL');
  } catch (error: any) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Ensure PostgreSQL is running: sudo systemctl status postgresql');
    console.log('2. Check pg_hba.conf allows connections from your host');
    console.log('3. Verify the credentials and database exist');
    process.exit(1);
  }

  // Step 4: Run migrations
  console.log('\n📋 Running database migrations...');
  
  try {
    const migrationPath = path.join(__dirname, 'migrations', '001_create_postgresql_schema.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    // Split statements carefully
    const statements = migrationSQL
      .split(/;\s*$|;\s*(?=\n)/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + (stmt.trim().endsWith(';') ? '' : ';'));
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const statement of statements) {
      if (statement.trim() && !statement.match(/^\s*--/)) {
        try {
          await pool.query(statement);
          successCount++;
        } catch (err: any) {
          if (err.message.includes('already exists')) {
            skipCount++;
          } else {
            console.error('Migration error:', err.message);
            throw err;
          }
        }
      }
    }
    
    console.log(`✅ Migrations completed: ${successCount} executed, ${skipCount} skipped`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }

  // Step 5: Verify tables
  console.log('\n📊 Verifying database schema...');
  
  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('✅ Tables created:');
    rows.forEach(row => console.log(`   - ${row.table_name}`));
  } catch (error) {
    console.error('❌ Failed to verify tables:', error);
  }

  // Step 6: Check for existing data
  const { rows: companyRows } = await pool.query('SELECT COUNT(*) as count FROM companies');
  const hasData = parseInt(companyRows[0].count) > 0;

  if (!hasData) {
    console.log('\n🌱 No data found. Would you like to:');
    console.log('1. Migrate from existing SQLite database: npm run migrate:sqlite-to-postgres');
    console.log('2. Start fresh with demo data (data will be inserted on first run)');
  } else {
    console.log(`\n✅ Database contains data: ${companyRows[0].count} companies found`);
  }

  // Step 7: Update .env file
  console.log('\n📝 Updating environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env');
  try {
    let envContent = await fs.readFile(envPath, 'utf-8').catch(() => '');
    
    if (!envContent.includes('DATABASE_TYPE=')) {
      envContent += '\n# Database Configuration\nDATABASE_TYPE=postgresql\n';
    } else {
      envContent = envContent.replace(/DATABASE_TYPE=\w+/, 'DATABASE_TYPE=postgresql');
    }
    
    if (!envContent.includes('DATABASE_URL=')) {
      envContent += `DATABASE_URL=${databaseUrl}\n`;
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Updated .env file to use PostgreSQL');
  } catch (error) {
    console.log('⚠️  Could not update .env file automatically');
    console.log(`Please add: DATABASE_TYPE=postgresql`);
    console.log(`Please add: DATABASE_URL=${databaseUrl}`);
  }

  await pool.end();
  
  console.log('\n🎉 PostgreSQL setup complete!');
  console.log('\nNext steps:');
  console.log('1. If migrating from SQLite: npm run migrate:sqlite-to-postgres');
  console.log('2. Start the server: npm run dev');
  console.log('3. The server will now use PostgreSQL automatically');
}

// Run setup
setupPostgreSQL().catch(error => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});