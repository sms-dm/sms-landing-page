import { AnalyticsService } from './src/services/analytics.service';
import { query } from './src/config/database';
import { initializeDatabase } from './src/config/database.abstraction';
import { startOfMonth, endOfMonth } from 'date-fns';

async function testAnalytics() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    
    // Run the analytics schema migration
    console.log('📊 Running analytics schema migration...');
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./src/migrations/008_add_analytics_schema.sql', 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await query(statement + ';');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Migration error:', error.message);
        }
      }
    }
    
    console.log('✅ Analytics schema created');
    
    // Get a test vessel
    const vessels = await query('SELECT id, name FROM vessels LIMIT 1');
    if (vessels.rows.length === 0) {
      console.log('❌ No vessels found in database');
      return;
    }
    
    const vesselId = vessels.rows[0].id;
    const vesselName = vessels.rows[0].name;
    console.log(`\n📍 Testing with vessel: ${vesselName} (ID: ${vesselId})`);
    
    // Calculate vessel analytics
    console.log('\n📈 Calculating vessel analytics...');
    const vesselAnalytics = await AnalyticsService.calculateVesselAnalytics(vesselId);
    console.log('Vessel Analytics:', {
      uptime: `${vesselAnalytics.equipment_uptime_percentage}%`,
      mttr: `${vesselAnalytics.avg_mttr_hours} hours`,
      totalFaults: vesselAnalytics.total_faults_reported,
      criticalFaults: vesselAnalytics.critical_faults,
      compliance: `${vesselAnalytics.maintenance_compliance_rate}%`
    });
    
    // Get a test technician
    const technicians = await query(`
      SELECT id, first_name, last_name 
      FROM users 
      WHERE role IN ('technician', 'chief_engineer', 'second_engineer') 
      LIMIT 1
    `);
    
    if (technicians.rows.length > 0) {
      const techId = technicians.rows[0].id;
      const techName = `${technicians.rows[0].first_name} ${technicians.rows[0].last_name}`;
      console.log(`\n👷 Testing with technician: ${techName} (ID: ${techId})`);
      
      // Calculate technician metrics
      console.log('📊 Calculating technician metrics...');
      const currentMonth = startOfMonth(new Date());
      const endMonth = endOfMonth(new Date());
      
      const techMetrics = await AnalyticsService.calculateTechnicianMetrics(
        techId,
        vesselId,
        currentMonth,
        endMonth
      );
      
      console.log('Technician Metrics:', {
        efficiency: `${techMetrics.efficiency_score}%`,
        faultsResolved: techMetrics.faults_resolved,
        avgResolutionTime: `${techMetrics.avg_resolution_time_hours} hours`,
        firstTimeFixRate: `${techMetrics.first_time_fix_rate}%`
      });
      
      // Check for achievements
      console.log('\n🏆 Checking for achievements...');
      const achievements = await AnalyticsService.checkTechnicianAchievements(techId);
      if (achievements.length > 0) {
        console.log(`Found ${achievements.length} achievements:`, achievements);
      } else {
        console.log('No new achievements');
      }
    }
    
    // Test fleet analytics
    console.log('\n🚢 Getting fleet analytics...');
    const companies = await query('SELECT id FROM companies LIMIT 1');
    if (companies.rows.length > 0) {
      const fleetAnalytics = await AnalyticsService.getFleetAnalytics(companies.rows[0].id);
      console.log('Fleet Summary:', {
        avgUptime: `${fleetAnalytics.fleet?.avg_fleet_uptime?.toFixed(1) || 0}%`,
        avgMTTR: `${fleetAnalytics.fleet?.avg_fleet_mttr?.toFixed(1) || 0} hours`,
        totalFaults: fleetAnalytics.fleet?.total_fleet_faults || 0,
        totalCost: `$${((fleetAnalytics.fleet?.total_fleet_cost || 0) / 1000).toFixed(0)}k`
      });
    }
    
    // Test performance recording
    console.log('\n📝 Recording test performance metric...');
    await AnalyticsService.recordPerformanceMetric(
      'vessel',
      vesselId,
      'test_metric',
      Math.random() * 100,
      'percentage',
      { test: true }
    );
    console.log('✅ Performance metric recorded');
    
    // Run analytics jobs manually
    console.log('\n🔄 Running analytics jobs...');
    const { analyticsJobs } = await import('./src/jobs/analyticsJobs');
    await analyticsJobs.runHourlyMetrics();
    console.log('✅ Hourly metrics recorded');
    
    console.log('\n✅ Analytics system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAnalytics();