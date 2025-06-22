import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbService = {
  db: null,

  async initialize() {
    const isTest = process.env.NODE_ENV === 'test';
    this.db = await open({
      filename: isTest ? ':memory:' : './usage.db',
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS USER_SESSIONS (
        session_id TEXT PRIMARY KEY,
        user_id TEXT,
        stage TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS AI_INTERACTIONS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        user_id TEXT,
        stage TEXT,
        user_input TEXT,
        session_context TEXT,
        ai_response TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost_usd REAL,
        feedback_helpful BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES USER_SESSIONS(session_id)
      );
    `);
    console.log('Connected to the usage database.');
  },

  async createSession(sessionId, userId) {
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(
      'INSERT OR IGNORE INTO USER_SESSIONS (session_id, user_id, stage) VALUES (?, ?, ?)',
      [sessionId, userId, 'problem_articulation']
    );
  },

  async logAIInteraction(data) {
    if (!this.db) throw new Error('Database not initialized.');
    const {
      sessionId, userId, stage, userInput, sessionContext,
      aiResponse, inputTokens, outputTokens, costUsd
    } = data;

    const result = await this.db.run(
      `INSERT INTO AI_INTERACTIONS (session_id, user_id, stage, user_input, session_context, ai_response, input_tokens, output_tokens, cost_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, stage, userInput, JSON.stringify(sessionContext), aiResponse, inputTokens, outputTokens, costUsd]
    );
    return result.lastID;
  },

  async logFeedback(sessionId, interactionId, helpful) {
    if (!this.db) throw new Error('Database not initialized.');
    await this.db.run(
      'UPDATE AI_INTERACTIONS SET feedback_helpful = ? WHERE id = ? AND session_id = ?',
      [helpful, interactionId, sessionId]
    );
  },

  async getSessionUsage(sessionId) {
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.get(
      'SELECT COUNT(*) as count FROM AI_INTERACTIONS WHERE session_id = ?',
      sessionId
    );
    return {
      sessionRequests: result.count,
      sessionLimit: 5 // Hardcoded for now
    };
  },

  async getDailyUsage(userId) {
    if (!this.db) throw new Error('Database not initialized.');
    const result = await this.db.get(
      `SELECT COUNT(*) as daily_requests, SUM(cost_usd) as daily_cost
       FROM AI_INTERACTIONS
       WHERE user_id = ? AND timestamp >= date('now', 'start of day')`,
      userId
    );
    return {
      dailyRequests: result.daily_requests || 0,
      dailyLimit: 10, // Hardcoded for now
      dailyCost: result.daily_cost || 0
    };
  },

  // A more robust rate limit check
  async checkRateLimits(userId, sessionId) {
    const dailyUsage = await this.getDailyUsage(userId);
    const sessionUsage = await this.getSessionUsage(sessionId);

    return {
      dailyAllowed: dailyUsage.dailyRequests < dailyUsage.dailyLimit,
      sessionAllowed: sessionUsage.sessionRequests < sessionUsage.sessionLimit,
      ...dailyUsage,
      ...sessionUsage
    };
  }
};

export default dbService;