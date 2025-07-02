"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import Tooltip from "@/components/Tooltip";
import { CheckCircle, Check } from "lucide-react";
import {
  HelpMeNuudleButton,
  AIAssistButton,
  AIResponseCard,
  AIErrorCard,
  SuggestedCause,
  useAIAssistant,
} from "@/components/AIComponents";
import { useSummaryDownloader, type SummaryData, type SessionData } from "@/hooks/useSummaryDownloader";

interface ActionableItem {
  id: string;
  cause: string;
  assumption?: string;
}

export default function SessionWizard() {
  const searchParams = useSearchParams();
  const [painPoint, setPainPoint] = useState("");
  const [step, setStep] = useState(0);
  const [causes, setCauses] = useState([{ cause: "", assumption: "" }]);
  const [solutions, setSolutions] = useState<{ [id: string]: string }>({});
  const [actionableItems, setActionableItems] = useState<ActionableItem[]>([]);
  const [highlightedContainerId, setHighlightedContainerId] = useState<string | null>(null);
  const [openActionBoxIds, setOpenActionBoxIds] = useState<string[]>([]);
  const [perpetuations, setPerpetuations] = useState<{ id: number; text: string }[]>([{ id: 1, text: "" }]);
  const [step2Phase, setStep2Phase] = useState<"input" | "selection">("input");
  const [selectedPerpetuations, setSelectedPerpetuations] = useState<string[]>([]);
  const [fears, setFears] = useState<{ [id: string]: { name: string; mitigation: string; contingency: string } }>({});
  const [openFearSections, setOpenFearSections] = useState<string[]>([]);
  const [notWorried, setNotWorried] = useState(false);
  const [suggestedCauses, setSuggestedCauses] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState<{
    selectedActionIds: string[];
    otherActionText: string;
    elaborationTexts: { [actionId: string]: string };
  }>({
    selectedActionIds: [],
    otherActionText: "",
    elaborationTexts: {},
  });
  const [sessionId, setSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  
  // New state for summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Use the summary downloader hook
  const summaryDownloader = useSummaryDownloader();
  
  // Initialize session ID
  useEffect(() => {
    setSessionId(`session_${Date.now()}`);
  }, []);

  // Load session data from URL parameters if editing
  useEffect(() => {
    if (!searchParams) return;
    
    const editMode = searchParams.get('edit');
    if (editMode) {
      try {
        const painPointParam = searchParams.get('pain_point');
        const causesParam = searchParams.get('causes');
        const assumptionsParam = searchParams.get('assumptions');
        const perpetuationsParam = searchParams.get('perpetuations');
        const solutionsParam = searchParams.get('solutions');
        const fearsParam = searchParams.get('fears');
        const actionPlanParam = searchParams.get('action_plan');

        if (painPointParam) {
          setPainPoint(decodeURIComponent(painPointParam));
        }

        if (causesParam && assumptionsParam) {
          const causesData = JSON.parse(decodeURIComponent(causesParam));
          const assumptionsData = JSON.parse(decodeURIComponent(assumptionsParam));
          
          const combinedCauses = [];
          if (causesData.primary_cause) {
            combinedCauses.push({
              cause: causesData.primary_cause,
              assumption: assumptionsData[0] || ""
            });
          }
          causesData.sub_causes?.forEach((cause: string, index: number) => {
            combinedCauses.push({
              cause,
              assumption: assumptionsData[index + 1] || ""
            });
          });
          
          if (combinedCauses.length > 0) {
            setCauses(combinedCauses);
          }
        }

        if (perpetuationsParam) {
          const perpetuationsData = JSON.parse(decodeURIComponent(perpetuationsParam));
          if (perpetuationsData.length > 0) {
            setPerpetuations(perpetuationsData.map((text: string, index: number) => ({
              id: index + 1,
              text
            })));
          }
        }

        if (solutionsParam) {
          const solutionsData = JSON.parse(decodeURIComponent(solutionsParam));
          if (solutionsData.length > 0) {
            const solutionsObj: { [id: string]: string } = {};
            solutionsData.forEach((solution: string, index: number) => {
              solutionsObj[`cause-${index}`] = solution;
            });
            setSolutions(solutionsObj);
          }
        }

        if (fearsParam) {
          const fearsData = JSON.parse(decodeURIComponent(fearsParam));
          if (fearsData.length > 0) {
            const fearsObj: { [id: string]: { name: string; mitigation: string; contingency: string } } = {};
            const openSections: string[] = [];
            fearsData.forEach((fear: any, index: number) => {
              const fearId = `cause-${index}`;
              fearsObj[fearId] = fear;
              openSections.push(fearId);
            });
            setFears(fearsObj);
            setOpenFearSections(openSections);
          }
        }

        if (actionPlanParam) {
          const actionPlanData = decodeURIComponent(actionPlanParam);
          if (actionPlanData.includes(':')) {
            // If it contains a colon, it's a selected action with elaboration
            const [actionText, elaboration] = actionPlanData.split(': ');
            setActionPlan({
              selectedActionIds: ['cause-0'], // Default to first action
              otherActionText: '',
              elaborationTexts: { 'cause-0': elaboration }
            });
          } else {
            // It's a custom action
            setActionPlan({
              selectedActionIds: ['other'],
              otherActionText: actionPlanData,
              elaborationTexts: {}
            });
          }
        }

        // Start at step 5 (final step) when editing
        setStep(5);
      } catch (error) {
        console.error('Error loading session data from URL:', error);
      }
    }
  }, [searchParams]);

  const ai = useAIAssistant(sessionId);

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const painPointTextareaRef = useRef<HTMLTextAreaElement>(null);
  const causeTextAreaRefs = useRef<Array<[HTMLTextAreaElement | null, HTMLTextAreaElement | null]>>([]);
  const readOnlyCauseTextAreaRefs = useRef<Array<[HTMLTextAreaElement | null, HTMLTextAreaElement | null]>>([]);
  const perpetuationsTextareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const solutionTextareaRefs = useRef<Map<string, HTMLTextAreaElement | null>>(new Map());
  const fearTextareaRefs = useRef<Map<string, { name: HTMLTextAreaElement | null; mitigation: HTMLTextAreaElement | null; contingency: HTMLTextAreaElement | null; }>>(new Map());
  const actionPlanTextareaRefs = useRef<Map<string, HTMLTextAreaElement | null>>(new Map());
  const otherActionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (stepRefs.current[step]) {
      stepRefs.current[step]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    ai.dismissResponse();
  }, [step]);

useLayoutEffect(() => {
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight,
      parseFloat(getComputedStyle(textarea).minHeight))}px`;
  };

  const allTextareas = document.querySelectorAll('.auto-resizing-textarea');
  allTextareas.forEach(textarea => {
    adjustTextareaHeight(textarea as HTMLTextAreaElement);
  });

  // Sync cause and assumption textareas after individual adjustment
  const syncPairs = (pairs: Array<[HTMLTextAreaElement | null, HTMLTextAreaElement | null]>) => {
    pairs.forEach(pair => {
      const [causeTextArea, assumptionTextArea] = pair;
      if (causeTextArea && assumptionTextArea) {
        const causeHeight = causeTextArea.clientHeight;
        const assumptionHeight = assumptionTextArea.clientHeight;
        const maxHeight = Math.max(causeHeight, assumptionHeight);
        causeTextArea.style.height = `${maxHeight}px`;
        assumptionTextArea.style.height = `${maxHeight}px`;
      }
    });
  };

  syncPairs(causeTextAreaRefs.current);
  syncPairs(readOnlyCauseTextAreaRefs.current);
}, [step, causes, perpetuations, solutions, fears, actionPlan, step2Phase, actionableItems]);

// Handle browser back-forward cache to reset textarea heights
useEffect(() => {
  const handlePageShow = (event: PageTransitionEvent) => {
    // If the page is loaded from cache (back/forward navigation)
    if (event.persisted) {
      // Reset all textarea heights
      const allTextareas = document.querySelectorAll('.auto-resizing-textarea');
      allTextareas.forEach(textarea => {
        const textareaElement = textarea as HTMLTextAreaElement;
        textareaElement.style.height = 'auto';
        textareaElement.style.height = `${Math.max(textareaElement.scrollHeight,
          parseFloat(getComputedStyle(textareaElement).minHeight))}px`;
      });

      // Sync cause and assumption textarea pairs
      const syncPairs = (pairs: Array<[HTMLTextAreaElement | null, HTMLTextAreaElement | null]>) => {
        pairs.forEach(pair => {
          const [causeTextArea, assumptionTextArea] = pair;
          if (causeTextArea && assumptionTextArea) {
            const causeHeight = causeTextArea.clientHeight;
            const assumptionHeight = assumptionTextArea.clientHeight;
            const maxHeight = Math.max(causeHeight, assumptionHeight);
            causeTextArea.style.height = `${maxHeight}px`;
            assumptionTextArea.style.height = `${maxHeight}px`;
          }
        });
      };

      syncPairs(causeTextAreaRefs.current);
      syncPairs(readOnlyCauseTextAreaRefs.current);
    }
  };

  window.addEventListener('pageshow', handlePageShow);
  
  return () => {
    window.removeEventListener('pageshow', handlePageShow);
  };
}, []);

  useEffect(() => {
    if (step === 3) {
      const causeItems: ActionableItem[] = causes
        .filter(c => c.cause.trim() !== "")
        .map((c, index) => ({
          id: `cause-${index}`,
          cause: c.cause,
          assumption: c.assumption,
        }));

      const perpetuationItems: ActionableItem[] = perpetuations
        .filter(p => selectedPerpetuations.includes(String(p.id)))
        .map(p => ({
          id: `perp-${p.id}`,
          cause: p.text,
        }));

      setActionableItems([...causeItems, ...perpetuationItems]);
    }
  }, [step, causes, perpetuations, selectedPerpetuations]);

  useEffect(() => {
    if (notWorried) {
      setOpenFearSections([]);
    }
  }, [notWorried]);

  // Clear highlighted container and open action boxes when navigating away from Step 3
  useEffect(() => {
    if (step !== 3) {
      setHighlightedContainerId(null);
      setOpenActionBoxIds([]);
    }
  }, [step]);

  useEffect(() => {
    if (ai.currentResponse && step === 3 && ai.loadingStage === 'suggest_causes') {
      const causes = ai.currentResponse.split('\n').filter(c => c.trim() !== '' && c.startsWith('- ')).map(c => c.substring(2));
      setSuggestedCauses(causes);
    } else {
      setSuggestedCauses([]);
    }
  }, [ai.currentResponse, step, ai.loadingStage]);

  // Helper function to determine if problem statement is too simplistic
  const isProblemSimplistic = (text: string): boolean => {
    const trimmedText = text.trim().toLowerCase();
    
    // Check for contextual keywords that indicate a well-defined problem
    const contextualKeywords = [
      // What indicators
      'what', 'which', 'how',
      // Where indicators
      'where', 'location', 'place', 'at work', 'at home', 'in',
      // When indicators
      'when', 'time', 'during', 'while', 'after', 'before', 'daily', 'weekly', 'monthly',
      // Purpose/outcome indicators (so that)
      'so that', 'in order to', 'to achieve', 'because', 'since', 'due to', 'for the purpose',
      'to ensure', 'to improve', 'to reduce', 'to increase', 'to help', 'to make',
      // Additional context indicators
      'specifically', 'particularly', 'especially', 'regarding', 'concerning', 'about',
      'involving', 'related to', 'with respect to'
    ];
    
    // Count how many contextual keywords are present
    const keywordCount = contextualKeywords.filter(keyword =>
      trimmedText.includes(keyword)
    ).length;
    
    // Also check for question words that indicate specificity
    const questionWords = ['who', 'what', 'where', 'when', 'why', 'how'];
    const hasQuestionWords = questionWords.some(word => trimmedText.includes(word));
    
    // Consider it simplistic if:
    // 1. Very short (less than 5 words)
    // 2. No contextual keywords AND no question words
    // 3. Less than 2 contextual indicators
    const wordCount = trimmedText.split(/\s+/).length;
    
    return wordCount < 5 || (keywordCount === 0 && !hasQuestionWords) || keywordCount < 2;
  };

  const startSession = () => {
    if (painPoint.trim()) {
      // Check if the problem statement is too simplistic
      if (isProblemSimplistic(painPoint)) {
        // Automatically trigger AI assistance to help elaborate the problem with intervention prompt
        ai.requestAssistance("problem_articulation_intervention", painPoint, { painPoint });
      } else {
        // Problem statement has sufficient context, proceed to step 1
        setStep(1);
      }
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleCauseChange = (
    index: number,
    field: "cause" | "assumption",
    value: string
  ) => {
    const newCauses = [...causes];
    newCauses[index][field] = value;
    setCauses(newCauses);
  };

  const addCause = (causeText = "") => {
    if (causes.length < 5) {
      setCauses([...causes, { cause: causeText, assumption: "" }]);
    }
  };

  const removeCause = (index: number) => {
    const newCauses = causes.filter((_, i) => i !== index);
    setCauses(newCauses);
  };

  const handlePerpetuationChange = (id: number, value: string) => {
    const newPerpetuations = perpetuations.map((p) =>
      p.id === id ? { ...p, text: value } : p
    );
    setPerpetuations(newPerpetuations);
  };

  const removePerpetuation = (id: number) => {
    const newPerpetuations = perpetuations.filter((p) => p.id !== id);
    setPerpetuations(newPerpetuations);
  };

  const addPerpetuation = () => {
    if (perpetuations.length < 5) {
      setPerpetuations([...perpetuations, { id: Date.now(), text: "" }]);
    }
  };

  const handlePerpetuationSelection = (selection: number | "none") => {
    const selectionStr = String(selection);

    if (selection === "none") {
      setSelectedPerpetuations(
        selectedPerpetuations.includes("none") ? [] : ["none"]
      );
    } else {
      const currentSelections = selectedPerpetuations.filter(
        (item) => item !== "none"
      );
      const newSelections = currentSelections.includes(selectionStr)
        ? currentSelections.filter((item) => item !== selectionStr)
        : [...currentSelections, selectionStr];
      setSelectedPerpetuations(newSelections);
    }
  };

  const handleSolutionSelection = (id: string) => {
    // Initialize solution text if it doesn't exist
    if (solutions[id] === undefined) {
      setSolutions(prev => ({ ...prev, [id]: "" }));
    }
    
    // Add to open action boxes if not already open
    setOpenActionBoxIds(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
    
    // Always set the highlighted container to the clicked item
    setHighlightedContainerId(id);
  };

  const removeSolutionAction = (id: string) => {
    // Remove from open action boxes (hide the box)
    setOpenActionBoxIds(prev => prev.filter(boxId => boxId !== id));
    
    // Clear highlight only if this was the highlighted container
    if (highlightedContainerId === id) {
      setHighlightedContainerId(null);
    }
    
    // Note: We do NOT delete from solutions to preserve the text
  };

  const handleSolutionActionChange = (id: string, action: string) => {
    setSolutions((prev) => ({
      ...prev,
      [id]: action,
    }));
  };

  const handleFearSelection = (id: string) => {
    setOpenFearSections(prev => {
      const newOpenFears = prev.includes(id)
        ? prev.filter(fearId => fearId !== id)
        : [...prev, id];
      
      if (newOpenFears.includes(id) && !fears[id]) {
        setFears(prevFears => ({
          ...prevFears,
          [id]: { name: "", mitigation: "", contingency: "" }
        }));
      }
      
      return newOpenFears;
    });
    setNotWorried(false);
  };

  const removeFearAction = (id: string) => {
    setOpenFearSections(prev => prev.filter(fearId => fearId !== id));
  };

  const handleFearChange = (
    id: string,
    field: "name" | "mitigation" | "contingency",
    value: string
  ) => {
    setFears(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleActionSelection = (actionId: string) => {
    setActionPlan(prev => ({
      ...prev,
      selectedActionIds: prev.selectedActionIds.includes(actionId)
        ? prev.selectedActionIds.filter(id => id !== actionId)
        : [...prev.selectedActionIds, actionId],
      otherActionText: ""
    }));
  };

  const handleOtherActionChange = (text: string) => {
    setActionPlan(prev => ({
      ...prev,
      selectedActionIds: text.trim() ? ["other"] : prev.selectedActionIds.filter(id => id !== "other"),
      otherActionText: text,
    }));
  };

  const handleElaborationChange = (actionId: string, text: string) => {
    setActionPlan(prev => ({
      ...prev,
      elaborationTexts: {
        ...prev.elaborationTexts,
        [actionId]: text,
      }
    }));
  };

  const handleBack = () => {
    prevStep();
  };

  const cleanupAndProceed = (
    items: any[],
    setItems: React.Dispatch<React.SetStateAction<any[]>>,
    proceedAction: () => void
  ) => {
    const cleanedItems = items.filter((item) => {
      if (typeof item === "string") {
        return item.trim() !== "";
      }
      if (typeof item === "object" && item !== null) {
        return Object.values(item).some((value) =>
          typeof value === "string" ? value.trim() !== "" : false
        );
      }
      return true;
    });
    setItems(cleanedItems.length > 0 ? cleanedItems : items);
    proceedAction();
  };

  const handleSubmit = async () => {
    // Instead of saving immediately, generate summary first
    const filteredCauses = causes.filter(
      (c) => c.cause.trim() !== "" || (c.assumption && c.assumption.trim() !== "")
    );

    const sessionData: SessionData = {
      pain_point: painPoint,
      causes: filteredCauses.map((c) => c.cause),
      assumptions: filteredCauses.map((c) => c.assumption || ""),
      perpetuations: perpetuations
        .map((p) => p.text)
        .filter((perpetuation) => perpetuation.trim() !== ""),
      solutions: Object.values(solutions).filter((solution) => solution.trim() !== ""),
      fears: Object.values(fears).filter(
        (fear) => fear.name.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
      ),
      action_plan:
        actionPlan.selectedActionIds.includes("other")
          ? actionPlan.otherActionText
          : actionPlan.selectedActionIds.length > 0
          ? actionPlan.selectedActionIds
              .filter(id => id !== "other")
              .map(id => {
                const action = solutions[id] || "";
                const elaboration = actionPlan.elaborationTexts[id] || "";
                return elaboration ? `${action}: ${elaboration}` : action;
              })
              .join("; ")
          : "",
    };

    const summary = await summaryDownloader.generateSummary(sessionId, sessionData);
    if (summary) {
      setShowSummaryModal(true);
    } else if (summaryDownloader.error) {
      setSubmitError(summaryDownloader.error);
    }
  };

  const saveToHistory = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const filteredCauses = causes.filter(
        (c) => c.cause.trim() !== "" || (c.assumption && c.assumption.trim() !== "")
      );

      const sessionData = {
        pain_point: painPoint,
        causes: filteredCauses.map((c) => c.cause),
        assumptions: filteredCauses.map((c) => c.assumption || ""),
        perpetuations: perpetuations
          .map((p) => p.text)
          .filter((perpetuation) => perpetuation.trim() !== ""),
        solutions: Object.values(solutions).filter((solution) => solution.trim() !== ""),
        fears: Object.values(fears).filter(
          (fear) => fear.name.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
        ),
        action_plan:
          actionPlan.selectedActionIds.includes("other")
            ? actionPlan.otherActionText
            : actionPlan.selectedActionIds.length > 0
            ? actionPlan.selectedActionIds
                .filter(id => id !== "other")
                .map(id => {
                  const action = solutions[id] || "";
                  const elaboration = actionPlan.elaborationTexts[id] || "";
                  return elaboration ? `${action}: ${elaboration}` : action;
                })
                .join("; ")
            : "",
        ai_summary: summaryDownloader.summaryData || null,
      };

      console.log("Saving session data:", sessionData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const savedSession = await response.json();
        console.log("Session saved successfully:", savedSession);
        
        // Mark session as saved and close modal
        setSessionSaved(true);
        setShowSummaryModal(false);
        window.location.href = "/history";
      } else {
        const errorText = await response.text();
        console.error("Failed to save session:", response.status, errorText);
        setSubmitError(`Failed to save session: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving session:", error);
      setSubmitError(`Error saving session: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToSession = () => {
    setShowSummaryModal(false);
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


const syncTextareaHeights = (e: React.FormEvent<HTMLTextAreaElement>, index?: number) => {
  const textarea = e.currentTarget;

  // For paired textareas, sync their heights
  if (index !== undefined) {
    const pair = causeTextAreaRefs.current[index];
    if (pair) {
      const [causeTextArea, assumptionTextArea] = pair;
      if (causeTextArea && assumptionTextArea) {
        // Reset both to auto to get their natural scrollHeight
        causeTextArea.style.height = 'auto';
        assumptionTextArea.style.height = 'auto';

        const causeScrollHeight = causeTextArea.scrollHeight;
        const assumptionScrollHeight = assumptionTextArea.scrollHeight;
        
        const maxHeight = Math.max(causeScrollHeight, assumptionScrollHeight);
        
        const minHeight = parseFloat(getComputedStyle(textarea).minHeight);
        const finalHeight = `${Math.max(maxHeight, minHeight)}px`;

        causeTextArea.style.height = finalHeight;
        assumptionTextArea.style.height = finalHeight;
        return; // Exit after handling paired textareas
      }
    }
  }

  // Fallback for non-paired textareas
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, parseFloat(getComputedStyle(textarea).minHeight))}px`;
};

  const getStepClass = (stepNumber: number) => {
    if (stepNumber === step) {
      return "step-container active";
    } else if (stepNumber < step) {
      return "step-container previous";
    } else {
      return "step-container upcoming";
    }
  };

  return (
    <>
      <style>{`
        .container-highlighted {
          border: 2px solid #007bff !important;
          border-radius: 8px;
        }
        .container-highlighted .read-only-textarea {
          border: 1px solid #ccc !important;
        }
        .container-highlighted .auto-resizing-textarea {
          border: 1px solid #ccc !important;
        }
        .auto-resizing-textarea {
          padding: 0.5rem;
        }
        .my-contributions-section {
        }
        .my-contributions-section .item-label {
          margin-bottom: 4px !important;
        }
        .action-textarea-container {
          margin-top: 8px;
        }
        .action-textarea-container .item-label {
          margin-bottom: 4px !important;
        }
      `}</style>
      <main className="wizard-container">
        <div className="content-wrapper" ref={contentWrapperRef}>
        {/* Step 0: Problem Articulation */}
        <div className={getStepClass(0)} ref={(el) => { stepRefs.current[0] = el; }}>
          <h1>Nuudle</h1>
          <h2 className="subheader">Mind Matters.</h2>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <div className="items-container">
<div className="deletable-item-container">
  <textarea
    ref={painPointTextareaRef}
    value={painPoint}
    onChange={(e) => setPainPoint(e.target.value)}
    onInput={(e) => syncTextareaHeights(e)}
    className="auto-resizing-textarea"
    placeholder="What problem would you like to work through today?"
    disabled={step !== 0}
  />
</div>
              </div>
              <div className="button-container justify-start mt-2">
              </div>
            </div>
          </div>
          <div className="button-container">
            <HelpMeNuudleButton
              onClick={() => {
                // Use the same logic as the Begin button to determine which prompt to use
                if (isProblemSimplistic(painPoint)) {
                  ai.requestAssistance("problem_articulation_intervention", painPoint, { painPoint });
                } else {
                  ai.requestAssistance("problem_articulation_context_aware", painPoint, { painPoint });
                }
              }}
              isLoading={ai.loadingStage === 'problem_articulation_direct' || ai.loadingStage === 'problem_articulation_intervention' || ai.loadingStage === 'problem_articulation_context_aware'}
              disabled={!painPoint.trim() || !ai.canUseAI}
              currentStep={step}
              buttonStep={0}
            />
            <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 0 && !painPoint.trim()}>
              <button type="button" onClick={startSession} disabled={step !== 0 || !painPoint.trim()} className="landing-button">
                Begin
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 0 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage={ai.loadingStage === 'problem_articulation_direct' ? 'problem_articulation_direct' :
                     ai.loadingStage === 'problem_articulation_intervention' ? 'problem_articulation_intervention' :
                     'problem_articulation_context_aware'}
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
        </div>

        {/* Step 1: Contributing Causes */}
        <div className={getStepClass(1)} ref={(el) => { stepRefs.current[1] = el; }}>
          <h1>Why do you think this problem is happening?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description">
                <p>
                  We live in a causal universe. Every effect has a cause that precedes it. Your problem is the effect.
                  <span style={{ display: 'block', textIndent: '1em' }}>
                    List up to five causes that you think could be contributing to the problem. For each cause that you identify, consider if there is a potential assumption that you might be making. An assumption is something believed to be true without evidence and requires validation through inquiry to be considered a true cause.
                  </span>
                </p>
              </label>
              <div className="causes-container">
                {causes.map((item, index) => {
                  if (!causeTextAreaRefs.current[index]) {
                    causeTextAreaRefs.current[index] = [null, null];
                  }
                  return (
                    <div key={index} className="deletable-item-container">
                      <div className="cause-assumption-pair">
                        <div className="cause-column" style={{ position: 'relative' }}>
                          <label className="item-label" style={{ display: 'block', marginBottom: '4px' }}>Contributing Cause</label>
                          <textarea
                            ref={(el) => {
                              causeTextAreaRefs.current[index][0] = el;
                            }}
                            value={item.cause}
                            onChange={(e) => handleCauseChange(index, "cause", e.target.value)}
                            onInput={(e) => syncTextareaHeights(e, index)}
                            className="auto-resizing-textarea"
                            disabled={step !== 1}
                          />
                        </div>
                        <div className="assumption-column" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <label className="item-label" style={{ display: 'block', margin: 0 }}>Potential Assumption</label>
                            {index > 0 && (
                              <button type="button" className="delete-item-button" style={{ top: '-4px' }} onClick={() => removeCause(index)} disabled={step !== 1}>
                                &times;
                              </button>
                            )}
                          </div>
                          <textarea
                            ref={(el) => {
                              causeTextAreaRefs.current[index][1] = el;
                            }}
                            value={item.assumption || ""}
                            onChange={(e) => handleCauseChange(index, "assumption", e.target.value)}
                            onInput={(e) => syncTextareaHeights(e, index)}
                            className="auto-resizing-textarea"
                            disabled={step !== 1}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cause-assumption-pair ai-button-row mt-2">
                <div className="cause-column">
                  <AIAssistButton
                    stage="root_cause"
                    isLoading={ai.loadingStage === 'root_cause'}
                    onRequest={() => ai.requestAssistance("root_cause", causes.map(c => c.cause).join(', '), { painPoint, causes })}
                    disabled={causes.filter(c => c.cause.trim()).length < 1 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ causes }}
                    currentStep={step}
                    buttonStep={1}
                  />
                </div>
                <div className="assumption-column">
                  <AIAssistButton
                    stage="identify_assumptions"
                    isLoading={ai.loadingStage === 'identify_assumptions'}
                    onRequest={() => ai.requestAssistance("identify_assumptions", causes.map(c => c.assumption).join(', '), { painPoint, causes })}
                    disabled={causes.filter(c => c.cause.trim()).length < 1 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ painPoint, causes }}
                    currentStep={step}
                    buttonStep={1}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 1}>
              Back
            </button>
            {causes.length < 5 && (
              <button type="button" onClick={() => addCause()} disabled={step !== 1 || (causes.length > 0 && causes[causes.length - 1].cause.trim() === "")}>
                Add another cause
              </button>
            )}
            <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 1 && (causes.length > 0 && causes[0].cause.trim() === "")}>
              <button type="button" onClick={() => cleanupAndProceed(causes, setCauses, nextStep)} disabled={step !== 1 || (causes.length > 0 && causes[0].cause.trim() === "")}>
                Next
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 1 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage="root_cause"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
        </div>

        {/* Step 2: Perpetuation */}
        <div className={getStepClass(2)} ref={(el) => { stepRefs.current[2] = el; }}>
          {step2Phase === "input" ? (
            <>
              <h1>If you were to perpetuate the problem, what actions could you take?</h1>
              <p className="step-description">Reflecting on these potential actions helps to uncover the behaviors and patterns that keep the problem in place, which is a crucial step towards solving it. If I wanted to make sure this problem continued, I would...</p>
              <div className="form-content initial-form-content">
                <div className="input-group">
                  <div className="items-container">
                    {perpetuations.map((perpetuation, index) => (
                      <div key={perpetuation.id} className="deletable-item-container">
                        <textarea
                          ref={el => {
                            if (el) perpetuationsTextareaRefs.current[index] = el;
                          }}
                          value={perpetuation.text}
                          onChange={(e) => handlePerpetuationChange(perpetuation.id, e.target.value)}
                          onInput={(e) => syncTextareaHeights(e)}
                          className="auto-resizing-textarea"
                          disabled={step !== 2}
                        />
                        {perpetuations.length > 1 && (
                          <button type="button" className="delete-item-button" onClick={() => removePerpetuation(perpetuation.id)} disabled={step !== 2}>
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ai-button-container mt-2">
                  <AIAssistButton
                    stage="perpetuation"
                    isLoading={ai.loadingStage === 'perpetuation'}
                    onRequest={() => ai.requestAssistance("perpetuation", perpetuations.map(p => p.text).join(', '), { painPoint, causes, perpetuations })}
                    disabled={perpetuations.filter(p => p.text.trim()).length === 0 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ perpetuations }}
                    currentStep={step}
                    buttonStep={2}
                  />
                </div>
              </div>
              <div className="button-container" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={prevStep} disabled={step !== 2}>
                  Back
                </button>
                {perpetuations.length < 5 && (
                  <button type="button" onClick={addPerpetuation} disabled={step !== 2 || (perpetuations.length > 0 && perpetuations[perpetuations.length - 1].text.trim() === "")}>
                    Add another action
                  </button>
                )}
                <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 2 && (perpetuations.length > 0 && perpetuations[0].text.trim() === "")}>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanedItems = perpetuations.filter((p) => p.text.trim() !== "");
                      setPerpetuations(cleanedItems.length > 0 ? cleanedItems : [{ id: 1, text: "" }]);
                      setStep2Phase("selection");
                    }}
                    disabled={step !== 2 || (perpetuations.length > 0 && perpetuations[0].text.trim() === "")}
                  >
                    Next
                  </button>
                </Tooltip>
              </div>
              {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
              {ai.currentResponse && step === 2 && (
                <AIResponseCard
                  response={ai.currentResponse}
                  stage="perpetuation"
                  onDismiss={ai.dismissResponse}
                  onFeedback={ai.provideFeedback}
                  canFollowUp={ai.canUseAI}
                />
              )}
            </>
          ) : (
            <>
              <h1>What's your role?</h1>
              <p className="step-description">Our problems rarely exist completely outside of ourselves. We often have a role to play. Try your best to be honest about yours. Click every action that you think might be actively contributing to the problem.</p>
              <div className="form-content initial-form-content">
                <div className="items-container">
                  {perpetuations.map((perpetuation) => (
                    <div
                      key={perpetuation.id}
                      className="deletable-item-container"
                      onClick={() => handlePerpetuationSelection(perpetuation.id)}
                      style={{ position: 'relative', cursor: 'pointer' }}
                    >
                      {selectedPerpetuations.includes(String(perpetuation.id)) && (
                        <Check
                          className="w-5 h-5 text-green-600"
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1
                          }}
                        />
                      )}
                      <textarea
                        value={perpetuation.text}
                        readOnly={true}
                        className={`auto-resizing-textarea read-only-textarea ${selectedPerpetuations.includes(String(perpetuation.id)) ? "selected" : ""}`}
                        style={{
                          paddingLeft: '40px',
                          cursor: 'pointer'
                        }}
                        rows={1}
                      />
                      {/* Hidden checkbox for form functionality */}
                      <input
                        type="checkbox"
                        checked={selectedPerpetuations.includes(String(perpetuation.id))}
                        onChange={() => handlePerpetuationSelection(perpetuation.id)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      id="none-of-the-above"
                      checked={selectedPerpetuations.includes("none")}
                      onChange={() => handlePerpetuationSelection("none")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 custom-checkbox"
                    />
                    <label htmlFor="none-of-the-above" className="ml-2 block text-sm text-gray-900">
                      None of these are actively contributing to the problem
                    </label>
                  </div>
                </div>
              </div>
              <div className="button-container" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setStep2Phase("input")} disabled={step !== 2}>
                  Back
                </button>
                <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 2 && selectedPerpetuations.length === 0}>
                  <button type="button" onClick={nextStep} disabled={step !== 2 || selectedPerpetuations.length === 0}>
                    Next
                  </button>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        {/* Step 3: Solutions */}
        <div className={getStepClass(3)} ref={(el) => { stepRefs.current[3] = el; }}>
          <h1>What can you do about it?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description">
                Select a contributing cause and outline a potential action you could take to address it. For your contributions, outline a potential action that would prevent yourself from perpetuating the problem.
              </label>
              <div className="items-container">
                {actionableItems.filter(item => item.id.startsWith('cause')).map((item) => {
                  const index = parseInt(item.id.split('-')[1], 10);
                  if (!readOnlyCauseTextAreaRefs.current[index]) {
                    readOnlyCauseTextAreaRefs.current[index] = [null, null];
                  }
                  return (
                    <div key={item.id} className={`actionable-item-container ${highlightedContainerId === item.id ? "container-highlighted" : ""}`} style={{ marginBottom: '1rem', paddingTop: openActionBoxIds.includes(item.id) ? '0.5rem' : '0', paddingBottom: openActionBoxIds.includes(item.id) ? '1rem' : '0' }}>
                      <div
                        className="deletable-item-container selectable-item"
                        onClick={() => handleSolutionSelection(item.id)}
                      >
                        <div className="cause-assumption-pair">
                          <div className="cause-column">
                            <label className="item-label" style={{ display: 'block', marginBottom: '4px' }}>Contributing Cause</label>
                            <textarea
                              ref={(el) => { readOnlyCauseTextAreaRefs.current[index][0] = el; }}
                              value={item.cause}
                              readOnly={true}
                              className="auto-resizing-textarea read-only-textarea"
                              rows={1}
                            />
                          </div>
                          <div className="assumption-column">
                            <label className="item-label" style={{ display: 'block', marginBottom: '4px' }}>Potential Assumption</label>
                            <textarea
                              ref={(el) => { readOnlyCauseTextAreaRefs.current[index][1] = el; }}
                              value={item.assumption || ""}
                              readOnly={true}
                              className="auto-resizing-textarea read-only-textarea"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                      {openActionBoxIds.includes(item.id) && (
                        <div className="action-textarea-container" style={{ padding: '0 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                            <label className="item-label" style={{ display: 'block', textAlign: 'center', margin: 0 }}>Possible Action</label>
                            <button type="button" className="delete-item-button" style={{ top: '-4px' }} onClick={() => removeSolutionAction(item.id)} disabled={step !== 3}>
                              &times;
                            </button>
                          </div>
                          <textarea
                            ref={el => { solutionTextareaRefs.current.set(item.id, el); }}
                            value={solutions[item.id]}
                            onChange={(e) => handleSolutionActionChange(item.id, e.target.value)}
                            onInput={(e) => syncTextareaHeights(e)}
                            className="auto-resizing-textarea"
                            placeholder="Enter your action here"
                            disabled={step !== 3}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {actionableItems.filter(item => item.id.startsWith('perp-')).length > 0 && (
                  <div className="my-contributions-section">
                    <label className="item-label" style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>My Contributions</label>
                    {actionableItems.filter(item => item.id.startsWith('perp-')).map((item) => (
                      <div key={item.id} className={`actionable-item-container ${highlightedContainerId === item.id ? "container-highlighted" : ""}`} style={{ marginBottom: '1rem', paddingTop: openActionBoxIds.includes(item.id) ? '0.5rem' : '0', paddingBottom: openActionBoxIds.includes(item.id) ? '1rem' : '0' }}>
                        <div style={{ padding: '0 0.5rem' }}>
                          <textarea
                            value={item.cause}
                            readOnly={true}
                            className="auto-resizing-textarea read-only-textarea"
                            onInput={(e) => syncTextareaHeights(e)}
                            onClick={() => handleSolutionSelection(item.id)}
                            rows={1}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        {openActionBoxIds.includes(item.id) && (
                          <div className="action-textarea-container" style={{ padding: '0 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                              <label className="item-label" style={{ display: 'block', textAlign: 'center', margin: 0 }}>Possible Action</label>
                              <button type="button" className="delete-item-button" style={{ top: '-4px' }} onClick={() => removeSolutionAction(item.id)} disabled={step !== 3}>
                                &times;
                              </button>
                            </div>
                            <textarea
                              ref={el => { solutionTextareaRefs.current.set(item.id, el); }}
                              value={solutions[item.id]}
                              onChange={(e) => handleSolutionActionChange(item.id, e.target.value)}
                              onInput={(e) => syncTextareaHeights(e)}
                              className="auto-resizing-textarea"
                              placeholder="Enter your action here"
                              disabled={step !== 3}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="ai-button-container mt-2">
            <AIAssistButton
              stage="potential_actions"
              isLoading={ai.loadingStage === 'potential_actions'}
              onRequest={() => {
                const draftedActions = Object.values(solutions).filter(action => action.trim() !== '').join('; ');
                const selectedPerpetuationTexts = perpetuations
                  .filter(p => selectedPerpetuations.includes(String(p.id)))
                  .map(p => p.text)
                  .join('; ');
                ai.requestAssistance("potential_actions", draftedActions, {
                  painPoint,
                  causes: causes.map(c => c.cause).join('; '),
                  solutions,
                  perpetuations: selectedPerpetuationTexts
                });
              }}
              disabled={Object.keys(solutions).length === 0 || !Object.values(solutions).some(action => action.trim() !== '') || !ai.canUseAI}
              sessionId={sessionId}
              context={{ painPoint, causes, solutions, perpetuations: selectedPerpetuations }}
              currentStep={step}
              buttonStep={3}
            />
          </div>
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 3}>
              Back
            </button>
            <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 3 && (Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== ""))}>
              <button type="button" onClick={() => {
                // Filter out empty solutions before proceeding
                const filteredSolutions = Object.fromEntries(
                  Object.entries(solutions).filter(([_, action]) => action.trim() !== "")
                );
                setSolutions(filteredSolutions);
                nextStep();
              }} disabled={step !== 3 || Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== "")}>
                Next
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 3 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage="potential_actions"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
        </div>

        {/* Step 4: Fears */}
        <div className={getStepClass(4)} ref={(el) => { stepRefs.current[4] = el; }}>
          <h1>What worries you?</h1>
          <p className="step-description">Select each action that you're hesitant about taking, then complete the fear, mitigation, and contingency prompts to build your confidence.</p>
          <div className="form-content initial-form-content">
            <div className="items-container">
              {Object.entries(solutions).map(([id, action]) => (
                <div key={id} className="actionable-item-container">
                  <div
                    className={`selectable-box ${openFearSections.includes(id) ? "selected" : ""}`}
                    onClick={() => handleFearSelection(id)}
                  >
                    <div className="item-text">{action}</div>
                  </div>
                  {openFearSections.includes(id) && fears[id] && (
                    <div className="fear-analysis-container">
                      <button type="button" className="delete-item-button" onClick={() => removeFearAction(id)} disabled={step !== 4}>
                        &times;
                      </button>
                      <div>
                        <label className="input-label">If you take this action, what could go wrong?</label>
                        <textarea
                          ref={el => {
                            const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                            fearTextareaRefs.current.set(id, { ...refs, name: el });
                          }}
                          value={fears[id]?.name || ""}
                          onChange={(e) => handleFearChange(id, "name", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">What action could you take to try and prevent that from happening?</label>
                        <textarea
                          ref={el => {
                            const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                            fearTextareaRefs.current.set(id, { ...refs, mitigation: el });
                          }}
                          value={fears[id].mitigation}
                          onChange={(e) => handleFearChange(id, "mitigation", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">If your fear comes true, what would you do to move forward?</label>
                        <textarea
                          ref={el => {
                            const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                            fearTextareaRefs.current.set(id, { ...refs, contingency: el });
                          }}
                          value={fears[id].contingency}
                          onChange={(e) => handleFearChange(id, "contingency", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="not-worried"
                checked={notWorried}
                onChange={(e) => setNotWorried(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="not-worried" className="ml-2 block text-sm text-gray-900">
                I'm not worried about taking any of these actions
              </label>
            </div>
            <div className="ai-button-container mt-2">
              <AIAssistButton
                stage="action_planning"
                isLoading={ai.loadingStage === 'action_planning'}
                onRequest={() => ai.requestAssistance("action_planning", Object.values(solutions).join(', '), { painPoint, causes, perpetuations: selectedPerpetuations, solutions, fears })}
                disabled={(Object.keys(fears).length === 0 && !notWorried) || !ai.canUseAI}
                sessionId={sessionId}
                context={{ solutions, fears }}
                currentStep={step}
                buttonStep={4}
              />
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 4}>
              Back
            </button>
            <Tooltip text="Attempt the prompt to proceed." isDisabled={step === 4 && (!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))}>
              <button
                type="button"
                onClick={nextStep}
                disabled={step !== 4 || (!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))}
              >
                Next
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 4 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage="action_planning"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
        </div>

        {/* Step 5: Action Plan */}
        <div className={getStepClass(5)} ref={(el) => { stepRefs.current[5] = el; }}>
          <h1>Stop Nuudling. Start Doodling.</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description mb-4">The most important step is always the next one. Choose yours.</label>
              <div className="items-container">
                {Object.entries(solutions).map(([id, action]) => (
                  <div key={id} className="actionable-item-container">
                    <div
                      className={`selectable-box ${actionPlan.selectedActionIds.includes(id) ? "selected" : ""}`}
                      onClick={() => handleActionSelection(id)}
                    >
                      {action}
                    </div>
                    {actionPlan.selectedActionIds.includes(id) && (
                      <textarea
                        ref={el => { actionPlanTextareaRefs.current.set(id, el); }}
                        value={actionPlan.elaborationTexts[id] || ""}
                        onChange={(e) => handleElaborationChange(id, e.target.value)}
                        onInput={(e) => syncTextareaHeights(e)}
                        className="auto-resizing-textarea"
                        placeholder="Optional Nuudling space if you'd like to elaborate."
                        disabled={step !== 5}
                      />
                    )}
                  </div>
                ))}
                <div>
                  <textarea
                    ref={otherActionTextareaRef}
                    value={actionPlan.otherActionText}
                    onChange={(e) => handleOtherActionChange(e.target.value)}
                    onInput={(e) => syncTextareaHeights(e)}
                    className="auto-resizing-textarea"
                    placeholder="Something else..."
                    disabled={step !== 5}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 5 || isSubmitting}>
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={summaryDownloader.generatingSummary || (actionPlan.selectedActionIds.length === 0 && !actionPlan.otherActionText.trim())}
            >
              {summaryDownloader.generatingSummary ? "Generating Summary..." : "Submit"}
            </button>
          </div>
          {(submitError || summaryDownloader.error) && (
            <div className="error-container" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
              <p style={{ color: '#c00', margin: 0 }}>{submitError || summaryDownloader.error}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Modal */}
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

              <div className="summary-section conclusion-section">
                <h2>Moving Forward</h2>
                <p>{summaryDownloader.summaryData.conclusion}</p>
              </div>
            </div>
            
            <div className="button-container" style={{ marginTop: '2rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={saveToHistory}
                disabled={isSubmitting || sessionSaved}
                className="action-button"
                style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
              >
                {isSubmitting ? "Saving..." : sessionSaved ? "Saved!" : "Save to my history"}
              </button>
              <button
                type="button"
                onClick={returnToSession}
                className="action-button"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
              >
                Return to Session
              </button>
            </div>
            
            {submitError && (
              <div className="error-container" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
                <p style={{ color: '#c00', margin: 0 }}>{submitError}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
    </main>
    </>
  );
}