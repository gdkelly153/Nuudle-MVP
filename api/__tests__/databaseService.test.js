import dbService from '../services/databaseService.js';

describe('Database Service', () => {
  beforeAll(async () => {
    // The initialize function in dbService is now aware of NODE_ENV=test
    // and will use an in-memory database automatically.
    await dbService.initialize();
  });

  beforeEach(async () => {
    // Clear all data before each test to ensure isolation
    await dbService.db.exec('DELETE FROM AI_INTERACTIONS');
    await dbService.db.exec('DELETE FROM USER_SESSIONS');
  });

  test('should create a user session correctly', async () => {
    const sessionId = 'test-session-1';
    const userId = 'test-user-1';
    await dbService.createSession(sessionId, userId);

    const session = await dbService.db.get('SELECT * FROM USER_SESSIONS WHERE session_id = ?', sessionId);
    expect(session).toBeDefined();
    expect(session.session_id).toBe(sessionId);
    expect(session.user_id).toBe(userId);
  });

  test('should log an AI interaction correctly', async () => {
    const interactionData = {
      sessionId: 'test-session-2',
      userId: 'test-user-2',
      stage: 'problem_articulation',
      userInput: 'I have a problem.',
      sessionContext: { painPoint: 'I have a problem.' },
      aiResponse: 'Tell me more.',
      inputTokens: 10,
      outputTokens: 5,
      costUsd: 0.0001
    };

    await dbService.createSession(interactionData.sessionId, interactionData.userId);
    const interactionId = await dbService.logAIInteraction(interactionData);

    expect(interactionId).toBe(1);

    const interaction = await dbService.db.get('SELECT * FROM AI_INTERACTIONS WHERE id = ?', interactionId);
    expect(interaction).toBeDefined();
    expect(interaction.stage).toBe('problem_articulation');
    expect(interaction.cost_usd).toBe(0.0001);
  });

  test('should calculate session usage correctly', async () => {
    const sessionId = 'test-session-3';
    const userId = 'test-user-3';
    await dbService.createSession(sessionId, userId);

    for (let i = 0; i < 3; i++) {
      await dbService.logAIInteraction({ sessionId, userId, stage: 'root_cause', inputTokens: 1, outputTokens: 1, costUsd: 0 });
    }

    const usage = await dbService.getSessionUsage(sessionId);
    expect(usage.sessionRequests).toBe(3);
    expect(usage.sessionLimit).toBe(5);
  });

  test('should calculate daily usage correctly', async () => {
    const userId = 'test-user-4';
    await dbService.createSession('session-4a', userId);
    await dbService.createSession('session-4b', userId);

    await dbService.logAIInteraction({ sessionId: 'session-4a', userId, stage: 'test', costUsd: 0.001 });
    await dbService.logAIInteraction({ sessionId: 'session-4b', userId, stage: 'test', costUsd: 0.002 });

    const usage = await dbService.getDailyUsage(userId);
    expect(usage.dailyRequests).toBe(2);
    expect(usage.dailyCost).toBeCloseTo(0.003);
    expect(usage.dailyLimit).toBe(10);
  });

  test('should log feedback correctly', async () => {
    const sessionId = 'test-session-5';
    const userId = 'test-user-5';
    await dbService.createSession(sessionId, userId);
    const interactionId = await dbService.logAIInteraction({ sessionId, userId, stage: 'test' });

    await dbService.logFeedback(sessionId, interactionId, true);

    const interaction = await dbService.db.get('SELECT * FROM AI_INTERACTIONS WHERE id = ?', interactionId);
    expect(interaction.feedback_helpful).toBe(1); // SQLite stores booleans as 0 or 1
  });
});