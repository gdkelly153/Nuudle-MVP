import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import sqlite3 from 'sqlite3';
import { getAssistance } from '../backend/services/aiService.js';

config();

const app = express();
const port = process.env.PORT || 3001;

// Database setup
const db = new sqlite3.Database('./usage.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the usage database.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    stage TEXT,
    tokens_used INTEGER
  )
`);

// Rate limiter setup
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send('Too Many Requests');
    });
};

// Body parsing middleware should be first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
  res.send('Hello from the API server!');
});

app.get('/api/test', (req, res) => {
  res.send('Test route is working!');
});

console.log('Registering /api/ai/assist route...');
app.post('/api/ai/assist', rateLimiterMiddleware, async (req, res) => {
  const { stage, context } = req.body;

  if (!stage || !context) {
    return res.status(400).json({ error: 'Stage and context are required.' });
  }

  try {
    const { question, tokens_used } = await getAssistance(stage, context);

    // Log usage to the database
    db.run(
      'INSERT INTO api_usage (stage, tokens_used) VALUES (?, ?)',
      [stage, tokens_used],
      (err) => {
        if (err) {
          console.error('Error logging API usage:', err.message);
        }
      }
    );

    res.json({ question });
  } catch (error) {
    console.error('Error getting assistance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});