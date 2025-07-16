console.log('Testing module imports...');

try {
  const sqliteModule = require('./src/config/database.ts');
  console.log('sqliteModule keys:', Object.keys(sqliteModule));
  console.log('sqliteModule.initializeDatabase:', typeof sqliteModule.initializeDatabase);
} catch (e) {
  console.error('Error importing sqliteModule:', e.message);
}

try {
  const postgresModule = require('./src/config/database.postgres.ts');
  console.log('postgresModule keys:', Object.keys(postgresModule));
  console.log('postgresModule.initializeDatabase:', typeof postgresModule.initializeDatabase);
} catch (e) {
  console.error('Error importing postgresModule:', e.message);
}