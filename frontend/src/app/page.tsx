"use client";

import React, { useState } from 'react';
import SessionWizard from "./SessionWizard";
import AuthModal from "@/components/AuthModal";
import CenteredLayout from "@/components/CenteredLayout";
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <CenteredLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
          
          <style jsx>{`
            .loading-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1rem;
            }

            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 4px solid var(--border-light);
              border-top: 4px solid var(--golden-mustard);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            p {
              color: var(--text-secondary);
              font-size: 0.875rem;
            }
          `}</style>
        </div>
      </CenteredLayout>
    );
  }

  // If not authenticated, show the landing page with auth modal
  if (!isAuthenticated) {
    return (
      <>
        <CenteredLayout>
          <main className="wizard-container">
            <div className="content-wrapper">
              <div className="step-container active">
                <h1>Nuudle</h1>
                <h2 className="subheader">Mind Matters</h2>
                <div className="form-content initial-form-content">
                  <div className="input-group">
                    <p className="step-description">
                      Welcome to Nuudle - your personal problem-solving companion.
                      Sign in or create an account to save your sessions and track your progress.
                    </p>
                  </div>
                </div>
                <div className="button-container">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="landing-button"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </main>
        </CenteredLayout>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // If authenticated, show the main session wizard
  return <SessionWizard />;
}
