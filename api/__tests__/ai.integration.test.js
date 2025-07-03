import request from 'supertest';
import app from '../server.js'; // Import the Express app
import dbService from '../services/databaseService.js';

describe('AI API Integration', () => {
  beforeAll(async () => {
    await dbService.initialize();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await dbService.db.exec('DELETE FROM AI_INTERACTIONS');
    await dbService.db.exec('DELETE FROM USER_SESSIONS');
  });

  describe('POST /api/ai/assist', () => {
    it('should return a successful AI response', async () => {
      const response = await request(app)
        .post('/api/ai/assist')
        .send({
          userId: 'user-1',
          sessionId: 'session-1',
          stage: 'problem_articulation',
          userInput: 'My team is not communicating well.',
          sessionContext: {}
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.interactionId).toBe(1);
      expect(response.body.usage.sessionRequests).toBe(1);
    });

    it('should return a 400 error for invalid input', async () => {
      await request(app)
        .post('/api/ai/assist')
        .send({
          userId: 'user-1',
          sessionId: 'session-1',
          // Missing stage and other required fields
        })
        .expect(400);
    });

    it('should respect rate limits', async () => {
      const agent = request.agent(app);
      const body = {
        userId: 'user-2',
        sessionId: 'session-2',
        stage: 'root_cause',
        userInput: 'We have no time.',
        sessionContext: {}
      };

      // Exhaust the session limit (5 requests)
      for (let i = 0; i < 5; i++) {
        await agent.post('/api/ai/assist').send(body).expect(200);
      }

      // The 6th request should be rate-limited
      const response = await agent.post('/api/ai/assist').send(body).expect(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Rate limit reached');
    });
  });

  describe('GET /api/ai/usage/:sessionId', () => {
    it('should return correct usage for a session', async () => {
      const agent = request.agent(app);
      const body = {
        userId: 'user-3',
        sessionId: 'session-3',
        stage: 'assumptions',
        userInput: 'This is an assumption.',
        sessionContext: {}
      };

      await agent.post('/api/ai/assist').send(body);
      await agent.post('/api/ai/assist').send(body);

      const response = await agent.get('/api/ai/usage/session-3?userId=user-3').expect(200);
      expect(response.body.sessionRequests).toBe(2);
      expect(response.body.dailyRequests).toBe(2);
    });
  });

  describe('POST /api/ai/feedback', () => {
    it('should store feedback successfully', async () => {
      // First, create an interaction to give feedback on
      const assistResponse = await request(app)
        .post('/api/ai/assist')
        .send({
          userId: 'user-4',
          sessionId: 'session-4',
          stage: 'action_planning',
          userInput: 'I will talk to my manager.',
          sessionContext: {}
        });

      const { interactionId } = assistResponse.body;

      // Now, submit feedback for that interaction
      const feedbackResponse = await request(app)
        .post('/api/ai/feedback')
        .send({
          sessionId: 'session-4',
          interactionId: interactionId,
          helpful: true
        })
        .expect(200);

      expect(feedbackResponse.body.success).toBe(true);

      // Verify in the database
      const interaction = await dbService.db.get('SELECT * FROM AI_INTERACTIONS WHERE id = ?', interactionId);
      expect(interaction.feedback_helpful).toBe(1);
    });
  });
});