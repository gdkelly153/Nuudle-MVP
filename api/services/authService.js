import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authService = {
  // Hash password using bcrypt
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare password with hash
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  // Generate JWT token
  generateToken(userId, email) {
    // Debug: Check JWT_SECRET value
    console.log('JWT_SECRET in generateToken:', process.env.JWT_SECRET ? 'EXISTS (length: ' + process.env.JWT_SECRET.length + ')' : 'UNDEFINED');
    
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword(password) {
    // At least 8 characters, contains at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // Generate secure cookie options
  getCookieOptions() {
    return {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };
  }
};

export default authService;