import React from 'react';
import { SummaryData } from '@/hooks/useSummaryDownloader';

interface SummaryRendererProps {
  summary: SummaryData;
  id?: string;
  className?: string;
}

const SummaryRenderer: React.FC<SummaryRendererProps> = ({ 
  summary, 
  id = 'summary-content',
  className = 'summary-content'
}) => {
  return (
    <div id={id} className={className}>
      <div className="summary-header">
        <h2 className="summary-title">{summary.title}</h2>
      </div>
      
      <div className="summary-section">
        <h3>Problem Overview</h3>
        <p>{summary.problem_overview}</p>
      </div>
      
      <div className="summary-section">
        <h3>Key Insights</h3>
        <ul>
          {summary.key_insights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>
      
      <div className="summary-section">
        <h3>Action Plan</h3>
        <div className="action-plan">
          <div className="primary-action">
            <h4>Primary Action</h4>
            <p>{summary.action_plan.primary_action}</p>
          </div>
          
          <div className="supporting-actions">
            <h4>Supporting Actions</h4>
            <ul>
              {summary.action_plan.supporting_actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
          
          <div className="timeline">
            <h4>Timeline</h4>
            <p>{summary.action_plan.timeline}</p>
          </div>
        </div>
      </div>
      
      <div className="summary-section">
        <h3>Feedback</h3>
        <div className="feedback">
          <div className="strengths">
            <h4>Strengths</h4>
            <p>{summary.feedback.strengths}</p>
          </div>
          
          <div className="areas-for-growth">
            <h4>Areas for Growth</h4>
            <p>{summary.feedback.areas_for_growth}</p>
          </div>
          
          <div className="validation">
            <h4>Validation</h4>
            <p>{summary.feedback.validation}</p>
          </div>
        </div>
      </div>
      
      <div className="summary-section">
        <h3>Conclusion</h3>
        <p>{summary.conclusion}</p>
      </div>
    </div>
  );
};

export default SummaryRenderer;