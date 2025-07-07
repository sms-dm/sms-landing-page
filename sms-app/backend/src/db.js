// Database module for JavaScript services
// This wraps the TypeScript database abstraction for use in JavaScript modules

const { dbRun, dbGet, dbAll, pool } = require('./config/database.abstraction');

module.exports = {
  // Query method that matches pg module interface
  async query(text, params) {
    try {
      // For SELECT queries, use dbAll
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await dbAll(text, params);
        return { rows };
      }
      
      // For INSERT with RETURNING, UPDATE with RETURNING, or DELETE with RETURNING
      if (text.includes('RETURNING')) {
        const rows = await dbAll(text, params);
        return { rows };
      }
      
      // For other queries (INSERT, UPDATE, DELETE without RETURNING)
      const result = await dbRun(text, params);
      return { rows: [], rowCount: result.changes };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Get a client for transactions
  async getClient() {
    if (pool) {
      // PostgreSQL - use real client
      const client = await pool.connect();
      return {
        query: async (text, params) => {
          const result = await client.query(text, params);
          return result;
        },
        release: () => client.release()
      };
    } else {
      // SQLite - simulate client interface
      let inTransaction = false;
      
      return {
        query: async (text, params) => {
          if (text === 'BEGIN') {
            await dbRun('BEGIN TRANSACTION');
            inTransaction = true;
            return { rows: [] };
          } else if (text === 'COMMIT') {
            await dbRun('COMMIT');
            inTransaction = false;
            return { rows: [] };
          } else if (text === 'ROLLBACK') {
            await dbRun('ROLLBACK');
            inTransaction = false;
            return { rows: [] };
          } else {
            return module.exports.query(text, params);
          }
        },
        release: () => {
          if (inTransaction) {
            dbRun('ROLLBACK').catch(console.error);
          }
        }
      };
    }
  }
};