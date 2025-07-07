import authService from '../services/authService.js';
import dbService from '../services/databaseService.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Get user from database to ensure they still exist
    const user = await dbService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Add user info to request object
    req.user = {
      userId: user._id.toString(),
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

// Optional auth middleware - doesn't fail if no token, but adds user if present
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken;
    
    if (token) {
      const decoded = authService.verifyToken(token);
      
      if (decoded) {
        const user = await dbService.getUserById(decoded.userId);
        
        if (user) {
          req.user = {
            userId: user._id.toString(),
            email: user.email
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request, just continue without user
    next();
  }
};

export { authMiddleware, optionalAuthMiddleware };