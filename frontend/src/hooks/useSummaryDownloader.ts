import { useState } from 'react';

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

  const generateSummary = async (sessionId: string, sessionData: SessionData): Promise<SummaryData | null> => {
    setGeneratingSummary(true);
    setError(null);
    
    try {
      console.log("Generating summary for session data:", sessionData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          sessionData: sessionData,
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

  const downloadAsPDF = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
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
    }
  };

  const saveAsImage = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
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