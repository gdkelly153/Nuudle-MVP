import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// A function to start the server after all dependencies are loaded
async function startServer() {
  // --- 1. Load Environment Variables ---
  // Use dynamic import to ensure dotenv runs first
  const dotenv = await import('dotenv');
  dotenv.config();

  // --- 2. Dynamically Import Services ---
  // These modules depend on the environment variables being loaded
  const { default: dbService } = await import('./services/databaseService.js');
  const { getResponse, getSummary } = await import('./services/aiService.js');
  const { default: authRoutes } = await import('./routes/authRoutes.js');
  const { authMiddleware } = await import('./middleware/authMiddleware.js');

  // --- 3. Initialize Express App ---
  const app = express();
  const port = process.env.PORT || 3001;

  // --- 4. Setup Middleware ---
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true // Allow cookies to be sent
  }));
  app.use(helmet());

  // --- 5. Define Routes ---
  app.get('/', (req, res) => {
    res.send('Hello from the Nuudle API server!');
  });

  // Authentication routes
  app.use('/api/auth', authRoutes);

  app.post('/api/ai/assist', authMiddleware, async (req, res) => {
    const { sessionId, stage, userInput, sessionContext } = req.body;
    const userId = req.user.userId; // Get userId from authenticated user
    if (!sessionId || !stage || !sessionContext) {
      return res.status(400).json({ error: 'sessionId, stage, and sessionContext are required.' });
    }
    // userInput can be empty for identify_assumptions stage
    if (!userInput && stage !== 'identify_assumptions') {
      return res.status(400).json({ error: 'userInput is required for this stage.' });
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

  app.get('/api/ai/usage/:sessionId', authMiddleware, async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.userId; // Get userId from authenticated user
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

  app.post('/api/ai/feedback', authMiddleware, async (req, res) => {
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

  app.post('/api/ai/summary', authMiddleware, async (req, res) => {
    const { sessionId, sessionData, aiInteractionLog } = req.body;
    const userId = req.user.userId; // Get userId from authenticated user
    if (!sessionId || !sessionData) {
      return res.status(400).json({ error: 'sessionId and sessionData are required.' });
    }
    try {
      await dbService.createSession(sessionId, userId);
      const result = await getSummary(userId, sessionId, sessionData, aiInteractionLog || []);
      const statusCode = result.success ? 200 : (result.error && result.error.includes('Rate limit') ? 429 : 500);
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Summary generation error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Sessions route for saving user sessions
  app.post('/api/sessions', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const sessionData = req.body;
      
      // Add user ID and timestamp to session data
      const sessionToSave = {
        ...sessionData,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Save to user_sessions collection using upsert
      const filter = { session_id: sessionData.session_id };
      const options = { upsert: true };
      const result = await dbService.db.collection('user_sessions').replaceOne(filter, sessionToSave, options);
      
      // Determine if this was a create or update operation
      const wasCreated = result.upsertedCount > 0;
      const statusCode = wasCreated ? 201 : 200; // 201 for Created, 200 for OK (updated)
      const message = wasCreated ? 'Session created successfully' : 'Session updated successfully';
      
      res.status(statusCode).json({
        success: true,
        sessionId: sessionData.session_id,
        message: message
      });
    } catch (error) {
      console.error('Error saving session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save session'
      });
    }
  });

  // Get user sessions
  app.get('/api/sessions', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const sessions = await dbService.getSessionsByUserId(userId);
      
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions'
      });
    }
  });

  // Delete a specific session
  app.delete('/api/sessions/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const sessionId = req.params.id;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }
      
      const deleted = await dbService.deleteSession(sessionId, userId);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Session deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session'
      });
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