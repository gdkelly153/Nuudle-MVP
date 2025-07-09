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

  const downloadAsPDF = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let clonedElement: HTMLElement | null = null;
    
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const originalElement = document.getElementById(elementId);
      if (!originalElement) return;
      
      // Create an off-screen clone for full content capture
      clonedElement = originalElement.cloneNode(true) as HTMLElement;
      
      // Position the clone off-screen and ensure it renders at full height
      clonedElement.style.position = 'absolute';
      clonedElement.style.top = '-9999px';
      clonedElement.style.left = '-9999px';
      clonedElement.style.zIndex = '-1';
      clonedElement.style.height = 'auto';
      clonedElement.style.maxHeight = 'none';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.width = originalElement.offsetWidth + 'px'; // Maintain original width
      
      // Find and modify any nested elements that might have height/overflow constraints
      const modalContent = clonedElement.querySelector('.modal-content');
      if (modalContent) {
        (modalContent as HTMLElement).style.height = 'auto';
        (modalContent as HTMLElement).style.maxHeight = 'none';
        (modalContent as HTMLElement).style.overflow = 'visible';
      }
      
      const summaryContent = clonedElement.querySelector('.summary-content');
      if (summaryContent) {
        (summaryContent as HTMLElement).style.height = 'auto';
        (summaryContent as HTMLElement).style.maxHeight = 'none';
        (summaryContent as HTMLElement).style.overflow = 'visible';
      }
      
      // Append to body to render
      document.body.appendChild(clonedElement);
      
      // Give the browser a moment to render the clone
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: clonedElement.scrollHeight,
        width: clonedElement.scrollWidth,
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
      // Always clean up the cloned element
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }
    }
  };

  const saveAsImage = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let clonedElement: HTMLElement | null = null;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const originalElement = document.getElementById(elementId);
      if (!originalElement) return;
      
      // Create an off-screen clone for full content capture
      clonedElement = originalElement.cloneNode(true) as HTMLElement;
      
      // Position the clone off-screen and ensure it renders at full height
      clonedElement.style.position = 'absolute';
      clonedElement.style.top = '-9999px';
      clonedElement.style.left = '-9999px';
      clonedElement.style.zIndex = '-1';
      clonedElement.style.height = 'auto';
      clonedElement.style.maxHeight = 'none';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.width = originalElement.offsetWidth + 'px'; // Maintain original width
      
      // Find and modify any nested elements that might have height/overflow constraints
      const modalContent = clonedElement.querySelector('.modal-content');
      if (modalContent) {
        (modalContent as HTMLElement).style.height = 'auto';
        (modalContent as HTMLElement).style.maxHeight = 'none';
        (modalContent as HTMLElement).style.overflow = 'visible';
      }
      
      const summaryContent = clonedElement.querySelector('.summary-content');
      if (summaryContent) {
        (summaryContent as HTMLElement).style.height = 'auto';
        (summaryContent as HTMLElement).style.maxHeight = 'none';
        (summaryContent as HTMLElement).style.overflow = 'visible';
      }
      
      // Append to body to render
      document.body.appendChild(clonedElement);
      
      // Give the browser a moment to render the clone
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: clonedElement.scrollHeight,
        width: clonedElement.scrollWidth,
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
      // Always clean up the cloned element
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
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