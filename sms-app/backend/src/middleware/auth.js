// JavaScript wrapper for TypeScript auth middleware
const { authenticateToken, authorizeRoles } = require('./auth.middleware');

module.exports = {
  authenticateToken,
  authorizeRoles
};