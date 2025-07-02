"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSummaryDownloader, type SessionData, type SummaryData } from "@/hooks/useSummaryDownloader";

interface SessionDataWithId extends SessionData {
  id: number;
  created_at: string;
  issue_tree: {
    primary_cause: string;
    sub_causes: string[];
  };
  ai_summary?: SummaryData;
}

export default function SessionSummaryPage() {
  const params = useParams();
  const sessionId = params?.id as string;
  
  const [sessionData, setSessionData] = useState<SessionDataWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Use the summary downloader hook
  const summaryDownloader = useSummaryDownloader();

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  // Load saved summary when session data is loaded
  useEffect(() => {
    if (sessionData && sessionData.ai_summary) {
      // Use the saved AI summary
      summaryDownloader.setSummaryData(sessionData.ai_summary);
      setShowSummaryModal(true);
    } else if (sessionData && !sessionData.ai_summary && !summaryDownloader.summaryData && !summaryDownloader.generatingSummary) {
      // Fallback: generate summary for old sessions without saved summaries
      generateSummary();
    }
  }, [sessionData, summaryDownloader.summaryData, summaryDownloader.generatingSummary]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      } else if (response.status === 404) {
        setError("Session not found");
      } else {
        setError("Failed to fetch session data");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setError("Error loading session");
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!sessionData) return;
    
    const sessionDataForSummary: SessionData = {
      pain_point: sessionData.pain_point,
      causes: [sessionData.issue_tree.primary_cause, ...sessionData.issue_tree.sub_causes],
      assumptions: sessionData.assumptions,
      perpetuations: sessionData.perpetuations,
      solutions: sessionData.solutions,
      fears: sessionData.fears,
      action_plan: sessionData.action_plan,
    };

    const summary = await summaryDownloader.generateSummary(`session_${sessionData.id}`, sessionDataForSummary);
    if (summary) {
      setShowSummaryModal(true);
    } else if (summaryDownloader.error) {
      setError(summaryDownloader.error);
    }
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
  };

  const downloadAsPDF = async () => {
    await summaryDownloader.downloadAsPDF(sessionId);
  };

  const shareOnSocial = async () => {
    await summaryDownloader.saveAsImage(sessionId);
  };

  if (loading) {
    return (
      <div className="summary-page-container">
        <div className="summary-page-wrapper">
          <div className="loading-container">
            <p>Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-page-container">
        <div className="summary-page-wrapper">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <Link href="/history" className="landing-button">
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="summary-page-container">
      <div className="summary-page-wrapper">
        <div className="session-summary-header">
          <div className="header-navigation">
            <Link href="/history" className="back-link">
              ← Back to History
            </Link>
          </div>
          <h1>Session Summary</h1>
          <p className="session-date">
            {new Date(sessionData.created_at).toLocaleDateString()}
          </p>
        </div>

        {summaryDownloader.generatingSummary && (
          <div className="loading-container">
            <p>Generating your personalized summary...</p>
          </div>
        )}
        
        {showSummaryModal && summaryDownloader.summaryData && (
          <div className="modal-overlay" onClick={closeSummaryModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close-button"
                onClick={closeSummaryModal}
                aria-label="Close modal"
              >
                ×
              </button>
              
              <div id="summary-content" className="summary-content">
                <div className="summary-header">
                  <h1>{summaryDownloader.summaryData.title}</h1>
                  <div className="summary-actions">
                    <button onClick={downloadAsPDF} className="action-button">
                      Download PDF
                    </button>
                    <button onClick={shareOnSocial} className="action-button">
                      Save as Image
                    </button>
                  </div>
                </div>

                <div className="summary-section">
                  <h2>Problem Overview</h2>
                  <p>{summaryDownloader.summaryData.problem_overview}</p>
                </div>

                <div className="summary-section">
                  <h2>Key Insights</h2>
                  <ul className="insights-list">
                    {summaryDownloader.summaryData.key_insights.map((insight: string, index: number) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>

                <div className="summary-section">
                  <h2>Feedback on Your Approach</h2>
                  <div className="feedback-grid">
                    <div className="feedback-item">
                      <h3>Strengths</h3>
                      <p>{summaryDownloader.summaryData.feedback.strengths}</p>
                    </div>
                    <div className="feedback-item">
                      <h3>Areas for Growth</h3>
                      <p>{summaryDownloader.summaryData.feedback.areas_for_growth}</p>
                    </div>
                  </div>
                </div>

                <div className="summary-section action-plan-section">
                  <h2>Recommended Action Plan</h2>
                  <div className="primary-action">
                    <h3>Primary Action</h3>
                    <p>{summaryDownloader.summaryData.action_plan.primary_action}</p>
                  </div>
                  
                  {summaryDownloader.summaryData.action_plan.supporting_actions.length > 0 && (
                    <div className="supporting-actions">
                      <h3>Supporting Actions</h3>
                      <ul>
                        {summaryDownloader.summaryData.action_plan.supporting_actions.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="timeline">
                    <h3>Timeline</h3>
                    <p>{summaryDownloader.summaryData.action_plan.timeline}</p>
                  </div>
                </div>

                <div className="summary-section conclusion-section">
                  <h2>Moving Forward</h2>
                  <p>{summaryDownloader.summaryData.conclusion}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}