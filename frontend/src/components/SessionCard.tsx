import React, { useState } from "react";
import Link from "next/link";
import { useSummaryDownloader, type SessionData, type SummaryData } from "@/hooks/useSummaryDownloader";

interface SessionProps {
  session: {
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
  };
  onViewSummary: (session: SessionProps['session']) => void;
  onDelete: (session: SessionProps['session']) => void;
  isDeleting?: boolean;
}

const SessionCard: React.FC<SessionProps> = ({ session, onViewSummary, onDelete, isDeleting = false }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const summaryDownloader = useSummaryDownloader();

  // Get the action plan text - prefer primary action from AI summary if available
  const getActionPlanText = () => {
    if (session.ai_summary?.action_plan?.primary_action) {
      return session.ai_summary.action_plan.primary_action;
    }
    return session.action_plan;
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (session.ai_summary) {
        // Use saved AI summary
        summaryDownloader.setSummaryData(session.ai_summary);
        await summaryDownloader.downloadAsPDF(`session_${session.id}`);
      } else {
        // Fallback: Generate summary for old sessions without saved summaries
        setIsGenerating(true);
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
        setIsGenerating(false);
        
        if (summary) {
          await summaryDownloader.downloadAsPDF(`session_${session.id}`);
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setIsGenerating(false);
    }
  };

  const handleSaveAsImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (session.ai_summary) {
        // Use saved AI summary
        summaryDownloader.setSummaryData(session.ai_summary);
        await summaryDownloader.saveAsImage(`session_${session.id}`);
      } else {
        // Fallback: Generate summary for old sessions without saved summaries
        setIsGenerating(true);
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
        setIsGenerating(false);
        
        if (summary) {
          await summaryDownloader.saveAsImage(`session_${session.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving as image:', error);
      setIsGenerating(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(session);
  };

  return (
    <div className={`session-card-compact ${isDeleting ? 'session-card-deleting' : ''}`}>
      <div className="session-card-header">
        {session.summary_header && (
          <h3 className="session-summary-header">
            {session.summary_header}
          </h3>
        )}
        <p className="session-date-compact">
          {new Date(session.created_at).toLocaleDateString()}
        </p>
      </div>
      
      <div className="session-card-body">
        <div className="session-preview-compact">
          <div className="preview-item-compact">
            <span className="preview-label">Problem:</span>
            <span className="preview-text">
              {session.pain_point}
            </span>
          </div>
          
        </div>
      </div>
      
      <div className="session-card-footer">
        <button
          onClick={() => onViewSummary(session)}
          className="action-button-compact view-summary-button-compact"
        >
          View AI Summary
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating || summaryDownloader.generatingSummary}
          className="action-button-compact download-button-compact"
          title="Download PDF"
        >
          {(isGenerating || summaryDownloader.generatingSummary) ? "Generating..." : "Download PDF"}
        </button>
        <button
          onClick={handleSaveAsImage}
          disabled={isGenerating || summaryDownloader.generatingSummary}
          className="action-button-compact image-button-compact"
          title="Save as Image"
        >
          {(isGenerating || summaryDownloader.generatingSummary) ? "Generating..." : "Save as Image"}
        </button>
        <button
          onClick={handleDelete}
          className="action-button-compact delete-button-compact"
          title="Delete Session"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;