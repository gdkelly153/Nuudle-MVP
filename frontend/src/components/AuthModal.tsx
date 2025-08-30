"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isLogin) {
      // Handle login
      const result = await login(email, password);
      if (result.success) {
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      // Handle registration
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 8 characters long and contain at least one letter and one number');
        setIsLoading(false);
        return;
      }

      const result = await register(email, password);
      if (result.success) {
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Registration failed');
      }
    }
    
    setIsLoading(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-content">
        <button
          className="modal-close-button"
          onClick={onClose}
          type="button"
        >
        </button>

        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to your Nuudle account' : 'Join Nuudle to save your sessions'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder={isLogin ? "Enter your password" : "Create a password"}
            />
            {!isLogin && (
              <small className="password-hint">
                At least 8 characters with letters and numbers
              </small>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password || (!isLogin && !confirmPassword)}
            className="auth-button"
          >
            {isLoading 
              ? (isLogin ? 'Signing In...' : 'Creating Account...') 
              : (isLogin ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={switchMode} 
              className="auth-link-button"
              disabled={isLoading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .auth-modal-content {
          background: var(--bg-secondary);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }


        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
          margin-top: 1rem;
        }

        .auth-header h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid var(--border-medium);
          border-radius: 6px;
          font-size: 1rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--golden-mustard);
          box-shadow: 0 0 0 3px var(--golden-mustard-focus);
        }

        .form-group input:disabled {
          background-color: var(--bg-primary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .password-hint {
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }

        .error-message {
          background-color: rgba(205, 101, 71, 0.1);
          border: 1px solid var(--warm-brick);
          color: var(--warm-brick);
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .auth-button {
          background: var(--golden-mustard);
          border: 1px solid var(--golden-mustard-border);
          color: #2c2c2c;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .auth-button:hover:not(:disabled) {
          background: var(--golden-mustard-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px var(--golden-mustard-focus);
        }

        .auth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-light);
        }

        .auth-footer p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-link-button {
          background: none;
          border: none;
          color: var(--golden-mustard);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0;
          transition: color 0.2s ease;
        }

        .auth-link-button:hover:not(:disabled) {
          color: var(--golden-mustard-hover);
          text-decoration: underline;
        }

        .auth-link-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .auth-modal-content {
            padding: 1.5rem;
            max-height: 95vh;
          }
          
        }
      `}</style>
    </div>
  );
};

export default AuthModal;