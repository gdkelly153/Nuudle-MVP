import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
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

// Utility function to ensure fonts and rendering are complete
const waitForRender = async (): Promise<void> => {
  // Wait for fonts to be ready
  await document.fonts.ready;
  
  // Wait for two animation frames to ensure layout and paint are complete
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));
};

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

  const createTemporarySummaryElement = async (summaryData: SummaryData, elementId: string): Promise<{ element: HTMLElement; cleanup: () => void }> => {
    // Create a temporary container - make it visible but positioned off-screen
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px'; // Fixed width for consistent rendering
    tempContainer.style.height = 'auto';
    tempContainer.style.overflow = 'visible';
    tempContainer.style.zIndex = '9999';
    tempContainer.style.visibility = 'visible'; // Make visible for html2canvas
    tempContainer.style.opacity = '1';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.padding = '20px';
    tempContainer.style.boxSizing = 'border-box';
    
    // Get the current theme and computed styles from the document
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const currentTheme = htmlElement.getAttribute('data-theme');
    
    // Copy theme attributes
    if (currentTheme) {
      tempContainer.setAttribute('data-theme', currentTheme);
    }
    
    // Copy all CSS custom properties (variables) from the root element
    const rootStyles = window.getComputedStyle(htmlElement);
    const bodyStyles = window.getComputedStyle(bodyElement);
    
    // Apply theme-aware background and text colors
    const backgroundColor = bodyStyles.backgroundColor ||
                           rootStyles.getPropertyValue('--background-color') ||
                           (currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    const textColor = bodyStyles.color ||
                     rootStyles.getPropertyValue('--text-color') ||
                     (currentTheme === 'dark' ? '#ffffff' : '#333333');
    
    tempContainer.style.backgroundColor = backgroundColor;
    tempContainer.style.color = textColor;
    
    // Copy essential font properties
    tempContainer.style.fontFamily = bodyStyles.fontFamily || 'Arial, sans-serif';
    tempContainer.style.fontSize = bodyStyles.fontSize || '16px';
    tempContainer.style.lineHeight = bodyStyles.lineHeight || '1.6';
    
    // Copy all CSS custom properties from root to the temporary container
    for (let i = 0; i < rootStyles.length; i++) {
      const property = rootStyles[i];
      if (property.startsWith('--')) {
        const value = rootStyles.getPropertyValue(property);
        tempContainer.style.setProperty(property, value);
      }
    }
    
    // Create a wrapper div that will contain the React component
    const reactWrapper = document.createElement('div');
    reactWrapper.style.width = '100%';
    reactWrapper.style.height = 'auto';
    reactWrapper.style.overflow = 'visible';
    // Add padding to the wrapper that will be captured by html2canvas
    reactWrapper.style.padding = '20px';
    reactWrapper.style.boxSizing = 'border-box';
    tempContainer.appendChild(reactWrapper);
    document.body.appendChild(tempContainer);
    
    // Create React root and render the SummaryRenderer component
    const root = createRoot(reactWrapper);
    
    return new Promise(async (resolve) => {
      root.render(React.createElement(SummaryRenderer, { summary: summaryData, id: elementId }));
      
      // Wait for rendering to complete using the robust waitForRender utility
      await waitForRender();
      
      const summaryElement = reactWrapper.querySelector(`#${elementId}`) as HTMLElement;
      if (summaryElement) {
        // Apply theme-aware styling to the summary element
        summaryElement.style.width = '100%';
        summaryElement.style.height = 'auto';
        summaryElement.style.overflow = 'visible';
        summaryElement.style.backgroundColor = backgroundColor;
        summaryElement.style.color = textColor;
        summaryElement.style.padding = '20px';
        summaryElement.style.margin = '0';
        summaryElement.style.boxSizing = 'border-box';
        
        // Force a layout calculation to ensure dimensions are calculated
        tempContainer.offsetHeight;
        summaryElement.offsetHeight;
        
        resolve({
          element: summaryElement,
          cleanup: () => {
            root.unmount();
            if (tempContainer.parentNode) {
              tempContainer.parentNode.removeChild(tempContainer);
            }
          }
        });
      } else {
        // Fallback cleanup if something goes wrong
        root.unmount();
        if (tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
        throw new Error('Failed to render summary component');
      }
    });
  };

  const downloadAsPDF = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let tempCleanup: (() => void) | null = null;
    let paddingElement: HTMLElement | null = null;
    
    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      // Try to find existing element first (for modal usage)
      let targetElement = document.getElementById(elementId);
      
      if (!targetElement) {
        // Create temporary element if not found (for SessionCard usage)
        const tempResult = await createTemporarySummaryElement(summaryData, elementId);
        targetElement = tempResult.element;
        tempCleanup = tempResult.cleanup;
      }
      
      if (!targetElement) return;
      
      // Find the timeline element that was causing page break issues
      const timelineElement = targetElement.querySelector('.timeline');
      
      if (timelineElement) {
        // Calculate precise padding needed for clean page break
        const timelineRect = timelineElement.getBoundingClientRect();
        const containerRect = targetElement.getBoundingClientRect();
        
        // Calculate the relative position of timeline within the content
        const timelineOffsetFromTop = timelineRect.top - containerRect.top;
        
        // A4 page height in pixels (approximately 1123px at 96 DPI)
        const pageHeightPx = 1123;
        
        // Calculate which page the timeline currently falls on
        const currentPagePosition = timelineOffsetFromTop % pageHeightPx;
        
        // If timeline is in the lower portion of a page, push it to next page
        if (currentPagePosition > pageHeightPx * 0.6) { // If it's more than 60% down a page
          const paddingNeeded = pageHeightPx - currentPagePosition + 10; // Small buffer
          
          // Create minimal padding element
          paddingElement = document.createElement('div');
          paddingElement.style.height = `${paddingNeeded}px`;
          paddingElement.style.width = '100%';
          paddingElement.style.visibility = 'hidden';
          paddingElement.style.pointerEvents = 'none';
          paddingElement.setAttribute('data-pdf-padding', 'true');
          
          // Insert before timeline element
          timelineElement.parentNode?.insertBefore(paddingElement, timelineElement);
          
          // Wait for layout to stabilize after padding insertion
          await waitForRender();
        }
      }
      
      // Wait for rendering to complete before dynamic padding and measurement
      await waitForRender();

      // DIAGNOSTIC LOGGING - After waitForRender (before padding)
      console.log('🔍 PDF DEBUG - After waitForRender (before padding):', {
        scrollHeight: targetElement.scrollHeight,
        offsetHeight: targetElement.offsetHeight,
        clientHeight: targetElement.clientHeight,
        scrollWidth: targetElement.scrollWidth,
        offsetWidth: targetElement.offsetWidth,
        clientWidth: targetElement.clientWidth
      });
      
      // Detect current theme for background color
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      const currentTheme = htmlElement.getAttribute('data-theme');
      const bodyStyles = window.getComputedStyle(bodyElement);
      const rootStyles = window.getComputedStyle(htmlElement);
      
      const backgroundColor = bodyStyles.backgroundColor ||
                             rootStyles.getPropertyValue('--background-color') ||
                             (currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
      
      // Calculate the actual content dimensions
      const fullHeight = Math.max(
        targetElement.scrollHeight,
        targetElement.offsetHeight,
        targetElement.clientHeight
      );
      const fullWidth = Math.max(
        targetElement.scrollWidth,
        targetElement.offsetWidth,
        targetElement.clientWidth
      );

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: fullHeight, // Force canvas to be full content height
        width: fullWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: fullWidth,
        backgroundColor: backgroundColor,
        ignoreElements: (element) => {
          // Ignore any elements that might interfere with capture
          return element.classList?.contains('modal-close-button') ||
                 element.classList?.contains('modal-overlay') ||
                 element.getAttribute('aria-hidden') === 'true';
        },
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
      
      while (heightLeft > 1) {
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
      // Clean up padding element
      if (paddingElement && paddingElement.parentNode) {
        paddingElement.parentNode.removeChild(paddingElement);
      }
      
      // Clean up temporary elements
      if (tempCleanup) {
        tempCleanup();
      }
    }
  };

  const saveAsImage = async (sessionId: string, elementId: string = 'summary-content') => {
    if (!summaryData) return;
    
    let tempCleanup: (() => void) | null = null;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Try to find existing element first (for modal usage)
      let targetElement = document.getElementById(elementId);
      
      if (!targetElement) {
        // Create temporary element if not found (for SessionCard usage)
        const tempResult = await createTemporarySummaryElement(summaryData, elementId);
        targetElement = tempResult.element;
        tempCleanup = tempResult.cleanup;
      }
      
      if (!targetElement) return;
      
      // Give the browser more time to render and apply styles
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Detect current theme for background color
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      const currentTheme = htmlElement.getAttribute('data-theme');
      const bodyStyles = window.getComputedStyle(bodyElement);
      const rootStyles = window.getComputedStyle(htmlElement);
      
      const backgroundColor = bodyStyles.backgroundColor ||
                             rootStyles.getPropertyValue('--background-color') ||
                             (currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
      
      // Ensure we capture the full content including any overflow
      const fullHeight = Math.max(
        targetElement.scrollHeight,
        targetElement.offsetHeight,
        targetElement.clientHeight
      );
      const fullWidth = Math.max(
        targetElement.scrollWidth,
        targetElement.offsetWidth,
        targetElement.clientWidth
      );

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: fullHeight,
        width: fullWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        backgroundColor: backgroundColor,
        ignoreElements: (element) => {
          // Ignore any elements that might interfere with capture
          return element.classList?.contains('modal-close-button') ||
                 element.classList?.contains('modal-overlay') ||
                 element.getAttribute('aria-hidden') === 'true';
        },
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
      if (tempCleanup) {
        tempCleanup();
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