#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity for both development and production environments
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Determine environment
const env = process.argv[2] || 'development';
const isDevelopment = env === 'development';

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '..', isDevelopment ? '.env.development' : '.env.production')
});

console.log(`\n🔍 Testing database connection for ${env} environment...`);
console.log(`📁 Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  const startTime = Date.now();
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Test query execution
    if (isDevelopment) {
      const result = await prisma.$queryRaw`SELECT sqlite_version() as version`;
      console.log(`✅ SQLite version: ${result[0].version}`);
    } else {
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log(`✅ PostgreSQL version: ${result[0].version.split(',')[0]}`);
    }
    
    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    console.log(`✅ Found ${tables.length} tables in database`);
    
    // Test a simple query
    const companies = await prisma.company.count();
    console.log(`✅ Companies in database: ${companies}`);
    
    const latency = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${latency}ms`);
    console.log('\n🎉 Database connection test passed!\n');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error(error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Hint: Make sure your database server is running');
    } else if (error.code === 'P1002') {
      console.error('\n💡 Hint: Check your database credentials and connection string');
    } else if (error.code === 'P1003') {
      console.error('\n💡 Hint: The database file might not exist. Run migrations first.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection().catch(console.error);