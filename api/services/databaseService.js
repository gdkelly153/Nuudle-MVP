import { MongoClient, ObjectId } from 'mongodb';

const dbService = {
  client: null,
  db: null,

  async initialize() {
    try {
      const isTest = process.env.NODE_ENV === 'test';
      
      console.log('🔍 DATABASE INITIALIZATION DEBUG:');
      console.log('  - NODE_ENV:', process.env.NODE_ENV || 'undefined');
      console.log('  - Is Test Mode:', isTest);
      console.log('  - MONGODB_URI exists:', !!process.env.MONGODB_URI);
      
      if (isTest) {
        // For testing, we'll use a test database
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        console.log('  - Using TEST database configuration');
        console.log('  - Test URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        
        this.client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        await this.client.connect();
        this.db = this.client.db('nuudle_test');
        console.log('  - Connected to TEST database: nuudle_test');
      } else {
        // Production/development MongoDB Atlas connection
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          console.error('❌ MONGODB_URI environment variable is not set!');
          throw new Error('MONGODB_URI environment variable is not set.');
        }
        
        console.log('  - Using PRODUCTION database configuration');
        console.log('  - Production URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        console.log('Connecting to MongoDB Atlas...');
        
        // Simple, stable connection options
        this.client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000
        });
        
        await this.client.connect();
        
        // Test the connection
        await this.client.db('admin').command({ ping: 1 });
        console.log('Successfully connected to MongoDB Atlas');
        
        this.db = this.client.db('nuudle');
        console.log('  - Connected to PRODUCTION database: nuudle');
        
        // Create indexes for better performance
        try {
          await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
          await this.db.collection('user_sessions').createIndex({ session_id: 1 }, { unique: true });
          await this.db.collection('user_sessions').createIndex({ user_id: 1 });
          await this.db.collection('ai_interactions').createIndex({ session_id: 1 });
          await this.db.collection('ai_interactions').createIndex({ user_id: 1 });
          await this.db.collection('ai_interactions').createIndex({ timestamp: 1 });
          console.log('Database indexes created successfully');
        } catch (indexError) {
          // Indexes might already exist, which is fine
          console.log('Database indexes already exist or failed to create:', indexError.message);
        }
      }

      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error; // Don't allow server to start without database
    }
  },

  async createSession(sessionId, userId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      await this.db.collection('user_sessions').updateOne(
        { session_id: sessionId },
        {
          $setOnInsert: {
            session_id: sessionId,
            user_id: userId,
            stage: 'problem_articulation',
            created_at: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async logAIInteraction(data) {
    if (!this.db) throw new Error('Database not initialized.');
    
    const {
      sessionId, userId, stage, userInput, sessionContext,
      aiResponse, inputTokens, outputTokens, costUsd
    } = data;

    try {
      const interaction = {
        session_id: sessionId,
        user_id: userId,
        stage: stage,
        user_input: userInput,
        session_context: sessionContext, // Already an object, no need to stringify
        ai_response: aiResponse,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        feedback_helpful: null,
        timestamp: new Date()
      };

      const result = await this.db.collection('ai_interactions').insertOne(interaction);
      return result.insertedId.toString();
    } catch (error) {
      console.error('Error logging AI interaction:', error);
      throw error;
    }
  },

  async logFeedback(sessionId, interactionId, helpful) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      // Convert string ID back to ObjectId for MongoDB
      const { ObjectId } = await import('mongodb');
      
      await this.db.collection('ai_interactions').updateOne(
        { 
          _id: new ObjectId(interactionId),
          session_id: sessionId 
        },
        { 
          $set: { feedback_helpful: helpful } 
        }
      );
    } catch (error) {
      console.error('Error logging feedback:', error);
      throw error;
    }
  },

  async getSessionUsage(sessionId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      const count = await this.db.collection('ai_interactions').countDocuments({
        session_id: sessionId
      });
      
      return {
        sessionRequests: count,
        sessionLimit: 1000 // Hardcoded for now
      };
    } catch (error) {
      console.error('Error getting session usage:', error);
      throw error;
    }
  },

  async getDailyUsage(userId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      // Get start of today in UTC
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            user_id: userId,
            timestamp: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            daily_requests: { $sum: 1 },
            daily_cost: { $sum: '$cost_usd' }
          }
        }
      ];

      const result = await this.db.collection('ai_interactions').aggregate(pipeline).toArray();
      const stats = result[0] || { daily_requests: 0, daily_cost: 0 };

      return {
        dailyRequests: stats.daily_requests,
        dailyLimit: 1000, // Hardcoded for now
        dailyCost: stats.daily_cost || 0
      };
    } catch (error) {
      console.error('Error getting daily usage:', error);
      throw error;
    }
  },

  // A more robust rate limit check
  async checkRateLimits(userId, sessionId) {
    try {
      const dailyUsage = await this.getDailyUsage(userId);
      const sessionUsage = await this.getSessionUsage(sessionId);

      return {
        dailyAllowed: dailyUsage.dailyRequests < dailyUsage.dailyLimit,
        sessionAllowed: sessionUsage.sessionRequests < sessionUsage.sessionLimit,
        ...dailyUsage,
        ...sessionUsage
      };
    } catch (error) {
      console.error('Error checking rate limits:', error);
      throw error;
    }
  },

  // User management functions
  async createUser(email, hashedPassword) {
    if (!this.db) throw new Error('Database not initialized.');
    
    console.log('👤 CREATE USER DEBUG:');
    console.log('  - Email:', email);
    console.log('  - Database connected:', !!this.db);
    console.log('  - Database name:', this.db.databaseName);
    
    try {
      const user = {
        email: email.toLowerCase(),
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('  - Attempting to insert user into users collection...');
      const result = await this.db.collection('users').insertOne(user);
      console.log('  - User creation result:', {
        insertedId: result.insertedId?.toString(),
        acknowledged: result.acknowledged
      });
      
      // Verify the user was actually saved
      const savedUser = await this.db.collection('users').findOne({ _id: result.insertedId });
      console.log('  - Verification - User exists in DB:', !!savedUser);
      if (savedUser) {
        console.log('  - Saved user email:', savedUser.email);
      }
      
      return result.insertedId.toString();
    } catch (error) {
      console.error('❌ Error creating user:', error);
      if (error.code === 11000) {
        console.log('  - Duplicate key error - user already exists');
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  },

  async getUserByEmail(email) {
    if (!this.db) throw new Error('Database not initialized.');
    
    console.log('🔍 GET USER BY EMAIL DEBUG:');
    console.log('  - Email:', email);
    console.log('  - Database connected:', !!this.db);
    console.log('  - Database name:', this.db.databaseName);
    
    try {
      const user = await this.db.collection('users').findOne({
        email: email.toLowerCase()
      });
      
      console.log('  - User found:', !!user);
      if (user) {
        console.log('  - Found user ID:', user._id?.toString());
        console.log('  - Found user email:', user.email);
        console.log('  - User created at:', user.created_at);
      } else {
        // Let's also check how many users are in the collection
        const userCount = await this.db.collection('users').countDocuments();
        console.log('  - Total users in collection:', userCount);
        
        // And let's see if there are any users at all
        const allUsers = await this.db.collection('users').find({}).limit(5).toArray();
        console.log('  - Sample users in collection:', allUsers.map(u => ({ id: u._id?.toString(), email: u.email })));
      }
      
      return user;
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      throw error;
    }
  },

  async getUserById(userId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      const user = await this.db.collection('users').findOne({
        _id: new ObjectId(userId)
      });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  async getSessionsByUserId(userId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      const sessions = await this.db.collection('user_sessions')
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
      return sessions;
    } catch (error) {
      console.error('Error getting sessions by user ID:', error);
      throw error;
    }
  },

  async deleteSession(sessionId, userId) {
    if (!this.db) throw new Error('Database not initialized.');
    
    try {
      // First, verify the session belongs to the user
      const session = await this.db.collection('user_sessions').findOne({
        _id: new ObjectId(sessionId),
        user_id: userId
      });
      
      if (!session) {
        throw new Error('Session not found or access denied');
      }
      
      // Delete associated AI interactions first (cascading delete)
      await this.db.collection('ai_interactions').deleteMany({
        session_id: session.session_id
      });
      
      // Delete the session
      const result = await this.db.collection('user_sessions').deleteOne({
        _id: new ObjectId(sessionId),
        user_id: userId
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  // Graceful shutdown
  async close() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB connection closed.');
    }
  }
};

export default dbService;