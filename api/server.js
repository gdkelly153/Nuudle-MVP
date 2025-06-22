import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// A function to start the server after all dependencies are loaded
async function startServer() {
  // --- 1. Load Environment Variables ---
  // Use dynamic import to ensure dotenv runs first
  const dotenv = await import('dotenv');
  dotenv.config();

  // --- 2. Dynamically Import Services ---
  // These modules depend on the environment variables being loaded
  const { default: dbService } = await import('./services/databaseService.js');
  const { getResponse } = await import('./services/aiService.js');

  // --- 3. Initialize Express App ---
  const app = express();
  const port = process.env.PORT || 3001;

  // --- 4. Setup Middleware ---
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(helmet());

  // --- 5. Define Routes ---
  app.get('/', (req, res) => {
    res.send('Hello from the Nuudle API server!');
  });

  app.post('/api/ai/assist', async (req, res) => {
    const { userId = 'default-user', sessionId, stage, userInput, sessionContext } = req.body;
    if (!sessionId || !stage || !userInput || !sessionContext) {
      return res.status(400).json({ error: 'sessionId, stage, userInput, and sessionContext are required.' });
    }
    try {
      await dbService.createSession(sessionId, userId);
      const result = await getResponse(userId, sessionId, stage, userInput, sessionContext);
      const statusCode = result.success ? 200 : (result.error.includes('Rate limit') ? 429 : 500);
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.get('/api/ai/usage/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.query.userId || 'default-user';
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }
    try {
      const usage = await dbService.checkRateLimits(userId, sessionId);
      res.status(200).json(usage);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/ai/feedback', async (req, res) => {
    const { sessionId, interactionId, helpful } = req.body;
    if (!sessionId || !interactionId || typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'sessionId, interactionId, and a boolean `helpful` value are required.' });
    }
    try {
      await dbService.logFeedback(sessionId, interactionId, helpful);
      res.status(200).json({ success: true, message: 'Feedback received.' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // --- 6. Initialize Database and Start Server ---
  await dbService.initialize();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  return app;
}

// Start the server
const appPromise = startServer();

// Export the promise for testing purposes
export default appPromise;