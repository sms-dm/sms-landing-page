// Prisma environment configuration helper
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';

// Determine which schema file to use
const schemaFile = isDevelopment ? 'schema.dev.prisma' : 'schema.prisma';
const schemaPath = path.join(__dirname, schemaFile);

// Create a symlink to the appropriate schema
const targetPath = path.join(__dirname, 'schema.prisma');
if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isSymbolicLink()) {
  fs.unlinkSync(targetPath);
}

console.log(`Using ${schemaFile} for ${env} environment`);

module.exports = {
  schemaPath,
  isDevelopment,
  env
};