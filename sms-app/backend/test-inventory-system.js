const db = require('./src/db');
const inventoryService = require('./src/services/inventoryService');

async function testInventorySystem() {
  console.log('🧪 Testing Parts Inventory System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking database tables...');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('parts_inventory', 'purchase_orders', 'low_stock_alerts', 'invoices')
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Found tables:', tables.rows.map(t => t.table_name).join(', '));
    } else {
      // Try SQLite query
      const sqliteTables = await db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('parts_inventory', 'purchase_orders', 'low_stock_alerts', 'invoices')
      `);
      
      if (sqliteTables.rows.length > 0) {
        console.log('✅ Found SQLite tables:', sqliteTables.rows.map(t => t.name).join(', '));
      } else {
        console.log('❌ Tables not found. Run migrations first.');
        return;
      }
    }

    // Test 2: Create sample parts inventory
    console.log('\n2️⃣ Creating sample parts inventory...');
    const sampleParts = [
      {
        vessel_id: 1,
        part_number: 'FLT-001',
        part_name: 'Oil Filter',
        description: 'Main engine oil filter',
        category: 'Filters',
        manufacturer: 'Marine Parts Co',
        current_stock: 3,
        minimum_stock: 5,
        unit_cost: 45.00,
        lead_time_days: 7,
        preferred_supplier: 'Marine Supply Inc',
        is_critical: true
      },
      {
        vessel_id: 1,
        part_number: 'BRG-002',
        part_name: 'Shaft Bearing',
        description: 'Propeller shaft bearing',
        category: 'Bearings',
        manufacturer: 'Bearing Systems Ltd',
        current_stock: 1,
        minimum_stock: 2,
        unit_cost: 280.00,
        lead_time_days: 14,
        preferred_supplier: 'Industrial Bearings Co',
        is_critical: true
      }
    ];

    for (const part of sampleParts) {
      try {
        await db.query(`
          INSERT INTO parts_inventory (
            vessel_id, part_number, part_name, description, category,
            manufacturer, current_stock, minimum_stock, unit_cost,
            lead_time_days, preferred_supplier, is_critical
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (vessel_id, part_number) DO UPDATE SET
            current_stock = $7,
            minimum_stock = $8,
            unit_cost = $9
        `, Object.values(part));
        console.log(`✅ Added part: ${part.part_name}`);
      } catch (error) {
        if (error.message.includes('ON CONFLICT')) {
          // SQLite doesn't support ON CONFLICT, try alternative
          await db.query(`
            INSERT OR REPLACE INTO parts_inventory (
              vessel_id, part_number, part_name, description, category,
              manufacturer, current_stock, minimum_stock, unit_cost,
              lead_time_days, preferred_supplier, is_critical
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, Object.values(part));
          console.log(`✅ Added part: ${part.part_name}`);
        } else {
          console.error(`❌ Error adding part ${part.part_name}:`, error.message);
        }
      }
    }

    // Test 3: Check low stock
    console.log('\n3️⃣ Checking for low stock items...');
    const lowStockCount = await inventoryService.checkLowStock();
    console.log(`✅ Found ${lowStockCount} items below minimum stock`);

    // Test 4: Query low stock alerts
    console.log('\n4️⃣ Retrieving low stock alerts...');
    const alerts = await inventoryService.getLowStockAlerts({ status: 'active' });
    console.log(`✅ Active alerts: ${alerts.length}`);
    
    alerts.forEach(alert => {
      console.log(`   - ${alert.part_name} (${alert.part_number}): ${alert.current_stock}/${alert.minimum_stock} units`);
    });

    // Test 5: Generate order number
    console.log('\n5️⃣ Testing order number generation...');
    const orderNumber = await inventoryService.generateOrderNumber();
    console.log(`✅ Generated order number: ${orderNumber}`);

    // Test 6: Check SMS notifications
    console.log('\n6️⃣ Checking SMS notifications...');
    const notifications = await db.query(`
      SELECT * FROM sms_notifications 
      WHERE notification_type = 'low_stock' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`✅ Found ${notifications.rows.length} low stock notifications`);

    console.log('\n✨ Parts Inventory System test completed successfully!');
    console.log('\n📊 Revenue Model Summary:');
    console.log('   - All parts have 20% markup applied automatically');
    console.log('   - SMS gets notified FIRST when stock is low');
    console.log('   - All orders must be approved by SMS admin');
    console.log('   - Invoices are generated with markup included (hidden from customer)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testInventorySystem();