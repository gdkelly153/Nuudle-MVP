"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';

const Navigation = () => {
  const { user, isAuthenticated, logout, isLoading, isSessionActive } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !isAuthenticated || !isSessionActive) {
    return null; // Don't render navigation while loading, not authenticated, or session not active
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link href="/" className="brand-link nav-bordered-item">
          Nuudle
        </Link>
        
        {isAuthenticated && (
          <>
            <Link href="/history" className="nav-link nav-bordered-item">
              History
            </Link>
            
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        )}
        
        <ThemeSwitcher />
      </div>

      <style jsx>{`
        .navigation {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          background: var(--bg-secondary);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-container {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.75rem 1.5rem;
          white-space: nowrap;
        }

        .nav-bordered-item {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-medium);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .nav-bordered-item:hover {
          background-color: var(--golden-mustard-focus);
          border-color: var(--golden-mustard);
          color: var(--golden-mustard);
        }

        .brand-link {
          color: var(--golden-mustard);
          text-decoration: none;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .nav-link {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
        }

        .user-email {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .logout-button {
          background: none;
          border: 1px solid var(--border-medium);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background-color: var(--golden-mustard-focus);
          border-color: var(--golden-mustard);
          color: var(--golden-mustard);
        }

        @media (max-width: 768px) {
          .navigation {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
            position: fixed;
          }

          .nav-container {
            gap: 1rem;
            padding: 0.5rem 1rem;
            flex-wrap: wrap;
            justify-content: center;
          }

          .user-email {
            display: none;
          }

          .brand-link {
            font-size: 1rem;
          }

          .nav-link {
            padding: 0.4rem 0.8rem;
            font-size: 0.875rem;
          }

          .logout-button {
            padding: 0.4rem 0.8rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;