import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbService = {
  db: null,

  async initialize() {
    this.db = await open({
      filename: './usage.db',
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        stage TEXT,
        tokens_used INTEGER
      )
    `);
    console.log('Connected to the usage database.');
  },

  async logApiUsage(stage, tokens_used) {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    await this.db.run(
      'INSERT INTO api_usage (stage, tokens_used) VALUES (?, ?)',
      [stage, tokens_used]
    );
  },

  async checkRateLimit() {
    // This is a placeholder for a more robust rate-limiting implementation
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    const result = await this.db.get(
      "SELECT COUNT(*) as count FROM api_usage WHERE timestamp > datetime('now', '-1 minute')"
    );
    return result.count < 10; // Limit to 10 requests per minute
  }
};

export default dbService;