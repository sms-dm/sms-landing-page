import { dbAll } from './config/database';

async function checkData() {
  console.log('📊 Checking database contents...\n');
  
  // Check vessels
  const vessels = await dbAll('SELECT id, name, imo_number FROM vessels ORDER BY id DESC LIMIT 5');
  console.log('🚢 Recent Vessels:');
  vessels.forEach(v => console.log(`  - ID: ${v.id}, Name: ${v.name}, IMO: ${v.imo_number}`));
  
  // Check equipment
  const equipment = await dbAll(`
    SELECT e.id, e.name, e.qr_code, e.vessel_id, e.criticality, e.classification, v.name as vessel_name
    FROM equipment e
    JOIN vessels v ON e.vessel_id = v.id
    ORDER BY e.id DESC 
    LIMIT 10
  `);
  console.log('\n⚙️  Recent Equipment:');
  equipment.forEach(e => console.log(`  - ID: ${e.id}, Name: ${e.name}, QR: ${e.qr_code}, Vessel: ${e.vessel_name} (ID: ${e.vessel_id}), Criticality: ${e.criticality || 'N/A'}`));
  
  // Check companies
  const companies = await dbAll('SELECT id, name FROM companies ORDER BY id DESC LIMIT 5');
  console.log('\n🏢 Recent Companies:');
  companies.forEach(c => console.log(`  - ID: ${c.id}, Name: ${c.name}`));
  
  process.exit(0);
}

checkData().catch(console.error);