const fs = require('fs');
const path = require('path');
const db = require('./src/db');

async function runInventoryMigration() {
  console.log('🚀 Running Parts Inventory System Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/migrations/007_add_parts_inventory_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but be careful about functions
    const statements = migrationSQL
      .split(/;\s*$(?![^$]*\$\$)/m)
      .filter(stmt => stmt.trim().length > 0);

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (!statement) continue;

      try {
        // Log the type of statement
        const stmtType = statement.split(/\s+/)[0].toUpperCase();
        console.log(`\n${i + 1}. Executing ${stmtType}...`);
        
        // Handle different statement types
        if (statement.includes('CREATE EXTENSION')) {
          // Skip extensions for SQLite
          const isPostgres = await checkIfPostgres();
          if (!isPostgres) {
            console.log('   ⏭️  Skipping extension (SQLite)');
            continue;
          }
        }

        // Execute the statement
        await db.query(statement);
        console.log('   ✅ Success');
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
        
        // Continue on certain errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('syntax error near "ON"')) {
          console.log('   ℹ️  Continuing despite error...');
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${statements.length}`);

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = ['parts_inventory', 'purchase_orders', 'purchase_order_items', 
                   'inventory_transactions', 'low_stock_alerts', 'sms_notifications', 'invoices'];
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: Not found or error`);
      }
    }

    console.log('\n✨ Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

async function checkIfPostgres() {
  try {
    await db.query('SELECT version()');
    return true;
  } catch {
    return false;
  }
}

// Run the migration
runInventoryMigration();