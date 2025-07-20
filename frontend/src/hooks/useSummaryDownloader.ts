import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SummaryRenderer from '@/components/SummaryRenderer';

export interface SummaryData {
  title: string;
  problem_overview: string;
  key_insights: string[];
  action_plan: {
    primary_action: string;
    supporting_actions: string[];
    timeline: string;
  };
  feedback: {
    strengths: string;
    areas_for_growth: string;
    validation: string;
  };
  conclusion: string;
}

export interface SessionData {
  pain_point: string;
  causes: string[];
  assumptions: string[];
  perpetuations: string[];
  solutions: string[];
  fears: { name: string; mitigation: string; contingency: string }[];
  action_plan: string;
}

export const useSummaryDownloader = () => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (sessionId: string, sessionData: SessionData, aiInteractionLog?: Array<{stage: string; userInputBefore: string; aiResponse: string}>): Promise<SummaryData | null> => {
    setGeneratingSummary(true);
    setError(null);
    
    try {
      console.log("Generating summary for session data:", sessionData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          sessionId: sessionId,
          sessionData: sessionData,
          aiInteractionLog: aiInteractionLog || [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSummaryData(result.summary);
          return result.summary;
        } else {
          const errorMsg = result.error || "Failed to generate summary";
          setError(errorMsg);
          return null;
        }
      } else {
        setError("Failed to generate summary");
        return null;
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      const errorMsg = `Error generating summary: ${error instanceof Error ? error.message : String(error)}`;
      setError(errorMsg);
      return null;
    } finally {
      setGeneratingSummary(false);
    }
  };

  const createTemporarySummaryElement = (summaryData: SummaryData, elementId: string): HTMLElement => {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.zIndex = '-1';
    tempContainer.style.width = '800px'; // Fixed width for consistent rendering
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = '#333';
    
    // Create the summary content element
    const summaryElement = document.createElement('div');
    summaryElement.id = elementId;
    summaryElement.className = 'summary-content';
    
    // Build the HTML content
    summaryElement.innerHTML = `
      <div class="summary-header" style="margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        <h2 style="margin: 0; color: #007bff; font-size: 24px;">${summaryData.title}</h2>
      </div>
      
      <div class="summary-section" style="margin-bottom: 20px;">
        <h3 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">Problem Overview</h3>
        <p style="margin: 0; text-align: justify;">${summaryData.problem_overview}</p>
      </div>
      
      <div class="summary-section" style="margin-bottom: 20px;">
        <h3 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">Key Insights</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${summaryData.key_insights.map(insight => `<li style="margin-bottom: 5px;">${insight}</li>`).join('')}
        </ul>
      </div>
      
      <div class="summary-section" style="margin-bottom: 20px;">
        <h3 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">Action Plan</h3>
        <div class="action-plan">
          <div class="primary-action" style="margin-bottom: 15px;">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Primary Action</h4>
            <p style="margin: 0; text-align: justify;">${summaryData.action_plan.primary_action}</p>
          </div>
          
          <div class="supporting-actions" style="margin-bottom: 15px;">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Supporting Actions</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${summaryData.action_plan.supporting_actions.map(action => `<li style="margin-bottom: 5px;">${action}</li>`).join('')}
            </ul>
          </div>
          
          <div class="timeline">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Timeline</h4>
            <p style="margin: 0; text-align: justify;">${summaryData.action_plan.timeline}</p>
          </div>
        </div>
      </div>
      
      <div class="summary-section" style="margin-bottom: 20px;">
        <h3 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">Feedback</h3>
        <div class="feedback">
          <div class="strengths" style="margin-bottom: 10px;">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Strengths</h4>
            <p style="margin: 0; text-align: justify;">${summaryData.feedback.strengths}</p>
          </div>
          
          <div class="areas-for-growth" style="margin-bottom: 10px;">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Areas for Growth</h4>
            <p style="margin: 0; text-align: justify;">${summaryData.feedback.areas_for_growth}</p>
          </div>
          
          <div class="validation">
            <h4 style="color: #333; font-size: 16px; margin-bottom: 5px;">Validation</h4>
            <p style="margin: 0; text-align: justify;">${summaryData.feedback.validation}</p>
          </div>
        </div>
      </div>
      
      <div class="summary-section">
        <h3 style="color: #007bff; font-size: 18px; margin-bottom: 10px;">Conclusion</h3>
        <p style="margin: 0; text-align: justify;">${summaryData.conclusion}</p>
      </div>
    `;
    
    tempContainer.appendChild(summaryElement);
    document.body.appendChild(tempContainer);
    
    return summaryElement;
  };

  const downloadAsPDF = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let tempElement: HTMLElement | null = null;
    let tempContainer: HTMLElement | null = null;
    
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Try to find existing element first (for modal usage)
      let targetElement = document.getElementById(elementId);
      
      if (!targetElement) {
        // Create temporary element if not found (for SessionCard usage)
        tempElement = createTemporarySummaryElement(summaryData, elementId);
        tempContainer = tempElement.parentElement;
        targetElement = tempElement;
      }
      
      if (!targetElement) return;
      
      // Give the browser a moment to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: targetElement.scrollHeight,
        width: targetElement.scrollWidth,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`nuudle-summary-${sessionId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Clean up temporary elements
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  };

  const saveAsImage = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let tempElement: HTMLElement | null = null;
    let tempContainer: HTMLElement | null = null;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Try to find existing element first (for modal usage)
      let targetElement = document.getElementById(elementId);
      
      if (!targetElement) {
        // Create temporary element if not found (for SessionCard usage)
        tempElement = createTemporarySummaryElement(summaryData, elementId);
        tempContainer = tempElement.parentElement;
        targetElement = tempElement;
      }
      
      if (!targetElement) return;
      
      // Give the browser a moment to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: targetElement.scrollHeight,
        width: targetElement.scrollWidth,
      });
      
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nuudle-summary-${sessionId}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      // Clean up temporary elements
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  };

  const clearSummary = () => {
    setSummaryData(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    summaryData,
    generatingSummary,
    error,
    generateSummary,
    downloadAsPDF,
    saveAsImage,
    clearSummary,
    clearError,
    setSummaryData,
  };
};