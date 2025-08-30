"use client";

import React, { useState, useEffect } from "react";
import SessionCard from "@/components/SessionCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSummaryDownloader, type SummaryData, type SessionData } from "@/hooks/useSummaryDownloader";

interface Session {
  id: string;
  created_at: string;
  pain_point: string;
  issue_tree: {
    primary_cause: string;
    sub_causes: string[];
  };
  assumptions: string[];
  perpetuations: string[];
  solutions: string[];
  fears: { name: string; mitigation: string; contingency: string }[];
  action_plan: string;
  ai_summary?: SummaryData;
  summary_header?: string;
}

const HistoryPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use the summary downloader hook
  const summaryDownloader = useSummaryDownloader();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        // Fetch from the authenticated API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
          credentials: 'include' // Include cookies for authentication
        });
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error("Failed to fetch sessions:", response.status);
          setError(`Failed to fetch sessions: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setError("Error fetching sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Get unique years from sessions for the year dropdown
  const getAvailableYears = () => {
    const years = sessions.map(session => new Date(session.created_at).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  // Filter sessions based on search query and date filters
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.created_at);
    const sessionMonth = sessionDate.getMonth() + 1; // getMonth() returns 0-11
    const sessionYear = sessionDate.getFullYear();

    // Date filtering
    const monthMatch = !selectedMonth || sessionMonth.toString() === selectedMonth;
    const yearMatch = !selectedYear || sessionYear.toString() === selectedYear;

    // Text search filtering
    const searchMatch = !searchQuery ||
      session.pain_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.issue_tree.primary_cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.issue_tree.sub_causes.some(cause =>
        cause.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      session.action_plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.assumptions.some(assumption =>
        assumption.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      session.solutions.some(solution =>
        solution.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return monthMatch && yearMatch && searchMatch;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const handleViewSummary = async (session: Session) => {
    setSelectedSession(session);
    
    if (session.ai_summary) {
      // Use saved AI summary
      summaryDownloader.setSummaryData(session.ai_summary);
      setShowSummaryModal(true);
    } else {
      // Fallback: Generate summary for old sessions without saved summaries
      const sessionData: SessionData = {
        pain_point: session.pain_point,
        causes: [session.issue_tree.primary_cause, ...session.issue_tree.sub_causes],
        assumptions: session.assumptions,
        perpetuations: session.perpetuations,
        solutions: session.solutions,
        fears: session.fears,
        action_plan: session.action_plan,
      };
      
      const summary = await summaryDownloader.generateSummary(`session_${session.id}`, sessionData);
      if (summary) {
        setShowSummaryModal(true);
      }
    }
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    setSelectedSession(null);
  };

  const downloadAsPDF = async () => {
    if (selectedSession) {
      await summaryDownloader.downloadAsPDF(`session_${selectedSession.id}`);
    }
  };

  const shareOnSocial = async () => {
    if (selectedSession) {
      await summaryDownloader.saveAsImage(`session_${selectedSession.id}`);
    }
  };

  const handleDeleteSession = (session: Session) => {
    setSessionToDelete(session);
    setDeletingSessionId(session.id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove the session from the local state
        setSessions(sessions.filter(session => session.id !== sessionToDelete.id));
        setShowDeleteModal(false);
        setSessionToDelete(null);
        setDeletingSessionId(null);
      } else {
        console.error('Failed to delete session:', response.status);
        // You could add error handling here
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      // You could add error handling here
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
    setDeletingSessionId(null);
  };

  if (loading) {
    return (
      <div className="wizard-step-container">
        <h2>Nuudle History</h2>
        <p>Loading your sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wizard-step-container">
        <h2>Nuudle History</h2>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="history-page-container">
      <div className="history-header">
        <h2>Nuudle History</h2>
        <p className="history-subtitle">
          {sessions.length === 0
            ? "No sessions found. Complete your first Nuudle session to see it here!"
            : `${filteredSessions.length} of ${sessions.length} sessions`}
        </p>
      </div>

      {sessions.length > 0 && (
        <>
          <div className="filters-container">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="date-filters">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                <option value="">All Years</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>

              {(searchQuery || selectedMonth || selectedYear) && (
                <button onClick={clearFilters} className="clear-filters-button">
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="sessions-list">
            {filteredSessions.length === 0 ? (
              <div className="no-results">
                <p>No sessions match your current filters.</p>
                <button onClick={clearFilters} className="clear-filters-button">
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onViewSummary={handleViewSummary}
                  onDelete={handleDeleteSession}
                  isDeleting={deletingSessionId === session.id}
                />
              ))
            )}
          </div>
        </>
      )}

      {showSummaryModal && summaryDownloader.summaryData && (
        <div className="modal-overlay" onClick={closeSummaryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-button"
              onClick={closeSummaryModal}
              aria-label="Close modal"
            >
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

      {summaryDownloader.generatingSummary && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="loading-container">
              <p>Generating your personalized summary...</p>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && sessionToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-button"
              onClick={cancelDelete}
              aria-label="Close modal"
            >
            </button>
            
            <div className="delete-confirmation">
              <p className="delete-confirmation-text">Are you sure you want to delete this session? This action cannot be undone.</p>
              <div className="delete-actions">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="delete-modal-cancel-btn"
                >
                  No, Go Back
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="delete-modal-delete-btn"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
};

export default HistoryPage;