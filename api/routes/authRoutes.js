import express from 'express';
import authService from '../services/authService.js';
import dbService from '../services/databaseService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  console.log('📝 REGISTRATION REQUEST DEBUG:');
  console.log('  - Request body:', { email: req.body.email, passwordLength: req.body.password?.length });
  console.log('  - Timestamp:', new Date().toISOString());
  
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('  - ❌ Validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validate email format
    if (!authService.isValidEmail(email)) {
      console.log('  - ❌ Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (!authService.isValidPassword(password)) {
      console.log('  - ❌ Validation failed: Weak password');
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain at least one letter and one number'
      });
    }

    console.log('  - ✅ Input validation passed');

    // Hash password
    console.log('  - Hashing password...');
    const hashedPassword = await authService.hashPassword(password);
    console.log('  - Password hashed successfully');

    // Create user
    console.log('  - Creating user in database...');
    const userId = await dbService.createUser(email, hashedPassword);
    console.log('  - User created with ID:', userId);

    // Generate JWT token
    console.log('  - Generating JWT token...');
    const token = authService.generateToken(userId, email);
    console.log('  - JWT token generated');

    // Set secure cookie
    console.log('  - Setting secure cookie...');
    res.cookie('authToken', token, authService.getCookieOptions());

    console.log('  - ✅ Registration completed successfully for:', email);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email: email.toLowerCase()
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.log('  - Error message:', error.message);
    console.log('  - Error stack:', error.stack);
    
    if (error.message === 'User with this email already exists') {
      console.log('  - Returning 409: User already exists');
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    console.log('  - Returning 500: Registration failed');
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST DEBUG:');
  console.log('  - Request body:', { email: req.body.email, passwordLength: req.body.password?.length });
  console.log('  - Timestamp:', new Date().toISOString());
  
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('  - ❌ Validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('  - ✅ Input validation passed');
    console.log('  - Looking up user in database...');

    // Get user from database
    const user = await dbService.getUserByEmail(email);

    if (!user) {
      console.log('  - ❌ User not found in database');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('  - ✅ User found in database');
    console.log('  - User ID:', user._id?.toString());
    console.log('  - Comparing password...');

    // Compare password
    const isValidPassword = await authService.comparePassword(password, user.password);

    if (!isValidPassword) {
      console.log('  - ❌ Password comparison failed');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('  - ✅ Password comparison successful');
    console.log('  - Generating JWT token...');

    // Generate JWT token
    const token = authService.generateToken(user._id.toString(), user.email);

    // Set secure cookie
    console.log('  - Setting secure cookie...');
    res.cookie('authToken', token, authService.getCookieOptions());

    console.log('  - ✅ Login completed successfully for:', email);
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.log('  - Error message:', error.message);
    console.log('  - Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Get current user status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.user.userId,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

export default router;