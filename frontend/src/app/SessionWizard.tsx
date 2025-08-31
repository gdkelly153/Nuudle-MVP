"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Tooltip from "@/components/Tooltip";
import { CheckCircle, Check, Target } from "lucide-react";
import {
  HelpMeNuudleButton,
  AIAssistButton,
  AIResponseCard,
  AIErrorCard,
  SuggestedCause,
} from "@/components/AIComponents";
import { CauseAnalysisModal } from "@/components/CauseAnalysisModal";
import { ActionPlanningModal } from "@/components/ActionPlanningModal";
import { FearsAnalysisModal } from "@/components/FearsAnalysisModal";
import { AIAssistantProvider, useAIAssistant, type ChatMessage } from "@/contexts/AIAssistantContext";
import { useSummaryDownloader, type SummaryData, type SessionData } from "@/hooks/useSummaryDownloader";

interface ActionableItem {
  id: string;
  cause: string;
}

function SessionWizardContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const [painPoint, setPainPoint] = useState("");
  const [step, setStep] = useState(0);
  const [showGuidanceHint, setShowGuidanceHint] = useState(false);
  const [guidanceHintShownCount, setGuidanceHintShownCount] = useState(0);
  const [causes, setCauses] = useState([{ id: "cause-0", cause: "", isRootCause: false }]);
  const [solutions, setSolutions] = useState<{ [id: string]: string[] }>({});
  const [causesSubmitted, setCausesSubmitted] = useState(false);
  const [playCauseAnimation, setPlayCauseAnimation] = useState(false);
  const [highlightedContainerId, setHighlightedContainerId] = useState<string | null>(null);
  const [perpetuations, setPerpetuations] = useState<{ id: number; text: string }[]>([{ id: 1, text: "" }]);
  const [step2Phase, setStep2Phase] = useState<"input" | "selection">("input");
  const [selectedPerpetuations, setSelectedPerpetuations] = useState<string[]>([]);
  const [fears, setFears] = useState<{ [id: string]: { risk: string; mitigation: string; contingency: string } }>({});
  const [openFearSections, setOpenFearSections] = useState<string[]>([]);
  const [notWorried, setNotWorried] = useState(false);
  const [suggestedCauses, setSuggestedCauses] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState<{
    selectedActionIds: string[];
    otherActionText: string;
  }>({
    selectedActionIds: [],
    otherActionText: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [analyzingCauseId, setAnalyzingCauseId] = useState<string | null>(null);
  const [causeAnalysisHistories, setCauseAnalysisHistories] = useState<{ [causeId: string]: ChatMessage[] }>({});
  
  // State for action planning modal
  const [planningActionId, setPlanningActionId] = useState<string | null>(null);
  const [actionPlanningHistories, setActionPlanningHistories] = useState<{ [actionId: string]: ChatMessage[] }>({});
  
  // State for fears analysis modal
  const [fearsAnalysisActionId, setFearsAnalysisActionId] = useState<string | null>(null);
  
  // State for cause exchange workflow
  const [showCauseExchangeModal, setShowCauseExchangeModal] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<{
    analyzingCauseId: string;
    selections: string[];
  } | null>(null);
  const [selectedCausesToReplace, setSelectedCausesToReplace] = useState<string[]>([]);
  
  // New state for AI-powered validation
  const [isValidatingProblem, setIsValidatingProblem] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // New state for summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // AI interaction logging for adaptive feedback
  const [aiInteractionLog, setAiInteractionLog] = useState<Array<{
    stage: string;
    userInputBefore: string;
    aiResponse: string;
  }>>([]);
  
  // Summary caching state
  const [cachedSessionData, setCachedSessionData] = useState<SessionData | null>(null);
  const [cachedSummary, setCachedSummary] = useState<any>(null);
  
  // Self-awareness analysis state
  const [isAnalyzingSelfAwareness, setIsAnalyzingSelfAwareness] = useState(false);
  const [selfAwarenessDetected, setSelfAwarenessDetected] = useState<boolean | null>(null);
  const [showMyContributions, setShowMyContributions] = useState(false);
  
  // Use the summary downloader hook
  const summaryDownloader = useSummaryDownloader();
  

  // Load session data from URL parameters if editing
  useEffect(() => {
    if (!searchParams) return;
    
    const editMode = searchParams.get('edit');
    if (editMode) {
      try {
        const painPointParam = searchParams.get('pain_point');
        const causesParam = searchParams.get('causes');
        const perpetuationsParam = searchParams.get('perpetuations');
        const solutionsParam = searchParams.get('solutions');
        const fearsParam = searchParams.get('fears');
        const actionPlanParam = searchParams.get('action_plan');

        if (painPointParam) {
          setPainPoint(decodeURIComponent(painPointParam));
        }

        if (causesParam) {
          const causesData = JSON.parse(decodeURIComponent(causesParam));
          
          const combinedCauses = [];
          if (causesData.primary_cause) {
            combinedCauses.push({
              id: `cause-${combinedCauses.length}`,
              cause: causesData.primary_cause,
              isRootCause: false,
            });
          }
          causesData.sub_causes?.forEach((cause: string) => {
            combinedCauses.push({
              id: `cause-${combinedCauses.length}`,
              cause,
              isRootCause: false,
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
            const solutionsObj: { [id: string]: string[] } = {};
            solutionsData.forEach((solution: string, index: number) => {
              solutionsObj[`cause-${index}`] = [solution];
            });
            setSolutions(solutionsObj);
          }
        }

        if (fearsParam) {
          const fearsData = JSON.parse(decodeURIComponent(fearsParam));
          if (fearsData.length > 0) {
            const fearsObj: { [id: string]: { risk: string; mitigation: string; contingency: string } } = {};
            const openSections: string[] = [];
            fearsData.forEach((fear: any, index: number) => {
              const fearId = `cause-${index}`;
              // Convert from old format if needed
              fearsObj[fearId] = {
                risk: fear.risk || fear.name || '',
                mitigation: fear.mitigation || '',
                contingency: fear.contingency || ''
              };
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
            const [actionText] = actionPlanData.split(': ');
            setActionPlan({
              selectedActionIds: ['cause-0'], // Default to first action
              otherActionText: ''
            });
          } else {
            // It's a custom action
            setActionPlan({
              selectedActionIds: ['other'],
              otherActionText: actionPlanData
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

  // Function to log AI interactions for adaptive feedback
  const logAIInteraction = (stage: string, userInputBefore: string, aiResponse: string) => {
    setAiInteractionLog(prev => [...prev, {
      stage,
      userInputBefore,
      aiResponse
    }]);
  };

  const ai = useAIAssistant();

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const painPointTextareaRef = useRef<HTMLTextAreaElement>(null);
  const causeTextAreaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const readOnlyCauseTextAreaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const perpetuationsTextareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const solutionTextareaRefs = useRef<Map<string, HTMLTextAreaElement | null>>(new Map());
  const fearTextareaRefs = useRef<Map<string, { name: HTMLTextAreaElement | null; mitigation: HTMLTextAreaElement | null; contingency: HTMLTextAreaElement | null; }>>(new Map());
  const otherActionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  

  useEffect(() => {
    ai.dismissResponse();
  }, [step]);

  // Calculate actionableItems directly during render to avoid layout shifts
  const actionableItems = useMemo(() => {
    if (step === 3 || step === 4) {
      const causeItems: ActionableItem[] = causes
        .filter(c => c.cause.trim() !== "")
        .map((c, index) => ({
          id: c.id,
          cause: c.cause,
        }));

      const perpetuationItems: ActionableItem[] = perpetuations
        .filter(p => selectedPerpetuations.includes(String(p.id)))
        .map(p => ({
          id: `perp-${p.id}`,
          cause: p.text,
        }));

      return [...causeItems, ...perpetuationItems];
    }
    return [];
  }, [step, causes, perpetuations, selectedPerpetuations]);

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

}, [step, causes, perpetuations, solutions, fears, actionPlan, step2Phase, actionableItems]);

// Scroll to position header at 20vh from top when step changes
useEffect(() => {
  if (!headerRefs.current[step]) return;

  // Small delay to ensure layout is ready
  const timeoutId = setTimeout(() => {
    const header = headerRefs.current[step];
    if (!header) return;

    // Calculate the desired position: 20vh from the top of the viewport
    const desiredTopPosition = window.innerHeight * 0.2;
    
    // Get the header's current position relative to the viewport
    const headerRect = header.getBoundingClientRect();
    const currentTopPosition = headerRect.top;
    
    // Calculate how much we need to scroll to get the header to the desired position
    const scrollOffset = currentTopPosition - desiredTopPosition;
    
    // Calculate the final scroll position
    const finalScrollPosition = window.scrollY + scrollOffset;
    
    // Scroll to the calculated position
    window.scrollTo({
      top: finalScrollPosition,
      behavior: "smooth"
    });
  }, 100);

  // Cleanup
  return () => {
    clearTimeout(timeoutId);
  };
}, [step]);

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

    }
  };

  window.addEventListener('pageshow', handlePageShow);
  
  return () => {
    window.removeEventListener('pageshow', handlePageShow);
  };
}, []);


  useEffect(() => {
    if (notWorried) {
      setOpenFearSections([]);
    }
  }, [notWorried]);

  // Clear highlighted container when navigating away from Step 3
  useEffect(() => {
    if (step !== 3) {
      setHighlightedContainerId(null);
    }
  }, [step]);

  useEffect(() => {
    const currentResponse = ai.getCurrentResponse();
    if (currentResponse && step === 3 && ai.loadingStage === 'suggest_causes') {
      const causes = currentResponse.split('\n').filter((c: string) => c.trim() !== '' && c.startsWith('- ')).map((c: string) => c.substring(2));
      setSuggestedCauses(causes);
    } else {
      setSuggestedCauses([]);
    }
  }, [ai.getCurrentResponse(), step, ai.loadingStage]);

  // Helper function to determine if input is goal-oriented
  const isInputGoalOriented = (text: string): boolean => {
    const trimmedText = text.trim().toLowerCase();
    
    // Goal-oriented keywords and phrases
    const goalKeywords = [
      'want to', 'wanna', 'like to', 'hope to', 'aim to', 'need to',
      'my goal is', 'i wish', 'i would like', 'i need', 'i want',
      'can i', 'how to', 'how do i', 'how can i', 'trying to',
      'would love to', 'looking to', 'seeking to', 'planning to'
    ];
    
    // Check if the text contains goal-oriented phrases
    for (const keyword of goalKeywords) {
      if (trimmedText.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  };

  // AI-powered validation function
  const validateProblemStatement = async (text: string): Promise<{ isValid: boolean; reason?: string }> => {
    if (!text.trim()) {
      return { isValid: false, reason: "Problem statement cannot be empty." };
    }

    setIsValidatingProblem(true);
    setValidationError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/validate-problem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemStatement: text.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Validation failed");
      }

      return {
        isValid: result.isValid,
        reason: result.reason
      };

    } catch (error) {
      console.error("Problem validation error:", error);
      setValidationError(error instanceof Error ? error.message : "Validation failed");
      
      // Fallback to basic length check if AI validation fails
      const wordCount = text.trim().split(/\s+/).length;
      return {
        isValid: wordCount >= 8,
        reason: wordCount >= 8 ? "Basic validation passed" : "Problem statement appears too brief"
      };
    } finally {
      setIsValidatingProblem(false);
    }
  };

  // Self-awareness analysis function
  const analyzeSelfAwareness = async (causesList: string[]): Promise<boolean> => {
    if (causesList.length === 0) return false;
    
    setIsAnalyzingSelfAwareness(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/analyze-self-awareness`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          causes: causesList
        }),
      });

      if (!response.ok) {
        throw new Error(`Self-awareness analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Self-awareness analysis failed");
      }

      return result.selfAwarenessDetected || false;

    } catch (error) {
      console.error("Self-awareness analysis error:", error);
      // If analysis fails, default to showing the contributions step
      return false;
    } finally {
      setIsAnalyzingSelfAwareness(false);
    }
  };

  const startSession = async () => {
    if (painPoint.trim()) {
      // Use AI-powered validation
      const validation = await validateProblemStatement(painPoint);
      
      if (!validation.isValid) {
        // Show guidance hint instead of automatically triggering AI
        setShowGuidanceHint(true);
        setGuidanceHintShownCount(prev => prev + 1);
      } else {
        // Problem statement is valid, proceed to step 1
        setShowGuidanceHint(false);
        setGuidanceHintShownCount(0); // Reset counter when user successfully proceeds
        setStep(1);
      }
    }
  };

  const nextStep = async () => {
    // Special handling when moving from Step 1 (Contributing Causes)
    if (step === 1) {
      const filteredCauses = causes.filter(c => c.cause.trim() !== "");
      const causeTexts = filteredCauses.map(c => c.cause);
      
      if (causeTexts.length > 0) {
        // Update the causes state with only the non-empty ones
        setCauses(filteredCauses);
        
        const selfAwarenessResult = await analyzeSelfAwareness(causeTexts);
        setSelfAwarenessDetected(selfAwarenessResult);
        
        if (selfAwarenessResult) {
          // User already shows self-awareness, skip to Step 3 (Solutions)
          setStep(3);
          return;
        } else {
          // User doesn't show self-awareness, show "My Contributions" step
          setShowMyContributions(true);
          setStep(2);
          return;
        }
      } else {
        // If all causes are empty, don't proceed and optionally show a message
        // For now, we'll just stay on the same step.
        return;
      }
    }
    
    // Default behavior for all other steps
    setStep(step + 1);
  };
  
  const prevStep = () => {
    // Special handling when going back from Step 3 to potentially Step 1
    if (step === 3 && selfAwarenessDetected === true) {
      // If we skipped the contributions step, go back to Step 1
      setStep(1);
      return;
    }
    
    setStep(step - 1);
  };

  const handleCauseChange = (index: number, value: string) => {
    const newCauses = [...causes];
    newCauses[index].cause = value;
    setCauses(newCauses);
  };

  const addCause = (causeText = "") => {
    if (causes.length < 5) {
      const newId = `cause-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setCauses([...causes, { id: newId, cause: causeText, isRootCause: false }]);
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
    // Only allow selection if we're on step 2
    if (step !== 2) return;
    
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


  const handleSolutionActionChange = (id: string, actionIndex: number, action: string) => {
    setSolutions((prev) => ({
      ...prev,
      [id]: prev[id] ? prev[id].map((a, i) => i === actionIndex ? action : a) : [action],
    }));
  };

  const addSolutionAction = (id: string) => {
    setSolutions((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), ""],
    }));
  };

  const removeSolutionAction = (id: string, actionIndex?: number) => {
    setSolutions(prev => {
      if (typeof actionIndex === 'number') {
        // Remove specific action
        const updatedActions = prev[id] ? prev[id].filter((_, i) => i !== actionIndex) : [];
        if (updatedActions.length === 0) {
          const newSolutions = { ...prev };
          delete newSolutions[id];
          return newSolutions;
        } else {
          return {
            ...prev,
            [id]: updatedActions,
          };
        }
      } else {
        // Remove all actions for this id
        const newSolutions = { ...prev };
        delete newSolutions[id];
        return newSolutions;
      }
    });
  };

  const handleFearSelection = (id: string) => {
    // Only allow selection if we're on step 4
    if (step !== 4) return;
    
    setOpenFearSections(prev => {
      const newOpenFears = prev.includes(id)
        ? prev.filter(fearId => fearId !== id)
        : [...prev, id];
      
      if (newOpenFears.includes(id) && !fears[id]) {
        setFears(prevFears => ({
          ...prevFears,
          [id]: { risk: "", mitigation: "", contingency: "" }
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
    field: "risk" | "mitigation" | "contingency",
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
    // Only allow selection if we're on step 5
    if (step !== 5) return;
    
    setActionPlan(prev => ({
      ...prev,
      selectedActionIds: prev.selectedActionIds.includes(actionId)
        ? prev.selectedActionIds.filter(id => id !== actionId)
        : [...prev.selectedActionIds.filter(id => id !== "other"), actionId]
    }));
  };

  const handleOtherActionChange = (text: string) => {
    setActionPlan(prev => ({
      ...prev,
      selectedActionIds: text.trim() ? ["other"] : prev.selectedActionIds.filter(id => id !== "other"),
      otherActionText: text,
    }));
  };

  const handleOtherActionFocus = () => {
    setActionPlan(prev => ({
      ...prev,
      selectedActionIds: prev.otherActionText.trim() ? ["other"] : []
    }));
  };

  const handleRootCauseSelections = (analyzingCauseId: string, selections: string[]) => {
    if (selections.length === 0) return;

    // Calculate available slots (5 total causes maximum)
    const currentNonEmptyCauses = causes.filter(c => c.cause.trim() !== '').length;
    const availableSlots = 5 - currentNonEmptyCauses;

    // First selection replaces the original cause, additional selections are new causes
    const additionalSelectionsNeeded = selections.length - 1;

    if (additionalSelectionsNeeded <= availableSlots) {
      // We can add all selections without exceeding the limit
      const newCauses = [...causes];
      const newlyAnalyzedIds = [analyzingCauseId]; // Track all affected causes
      
      // Replace the original cause with the first selection and mark as root cause
      const causeIndex = newCauses.findIndex(c => c.id === analyzingCauseId);
      if (causeIndex !== -1) {
        newCauses[causeIndex] = { ...newCauses[causeIndex], cause: selections[0], isRootCause: true };
      }

      // Add additional selections as new causes with guaranteed unique IDs
      for (let i = 1; i < selections.length; i++) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 5);
        const newId = `cause-${timestamp}-${randomSuffix}`;
        newCauses.push({
          id: newId,
          cause: selections[i],
          isRootCause: true
        });
        newlyAnalyzedIds.push(newId); // Track the new cause as analyzed
      }

      setCauses(newCauses);
      
    } else {
      // We need to show the cause exchange modal
      setPendingSelections({
        analyzingCauseId,
        selections
      });
      setShowCauseExchangeModal(true);
    }
  };

  const handleCauseExchange = (causesToReplace: string[]) => {
    if (!pendingSelections) return;

    const { analyzingCauseId, selections } = pendingSelections;
    const newCauses = [...causes];

    // Replace the original analyzed cause with the first selection
    const originalCauseIndex = newCauses.findIndex(c => c.id === analyzingCauseId);
    if (originalCauseIndex !== -1) {
      newCauses[originalCauseIndex] = { ...newCauses[originalCauseIndex], cause: selections[0] };
    }

    // Replace the selected causes with the remaining selections
    let selectionIndex = 1;
    causesToReplace.forEach(causeToReplace => {
      if (selectionIndex < selections.length) {
        const causeIndex = newCauses.findIndex(c => c.cause === causeToReplace);
        if (causeIndex !== -1) {
          newCauses[causeIndex] = { ...newCauses[causeIndex], cause: selections[selectionIndex] };
          selectionIndex++;
        }
      }
    });

    setCauses(newCauses);
    setShowCauseExchangeModal(false);
    setPendingSelections(null);
    setSelectedCausesToReplace([]);
  };

  const handleActionPlanning = (actionId: string, finalActions?: string[]) => {
    if (finalActions && finalActions.length > 0) {
      // Update the solutions state with the planned actions array
      setSolutions(prev => ({
        ...prev,
        [actionId]: finalActions
      }));

      // Set the highlighted container to show the completed actions
      setHighlightedContainerId(actionId);
    }
    
    setPlanningActionId(null);
  };

  const handleFearsAnalysis = (actionId: string, answers?: { risk: string; mitigation: string; contingency: string }) => {
    if (answers) {
      setFears(prev => ({
        ...prev,
        [actionId]: answers
      }));
    }
    
    setFearsAnalysisActionId(null);
  };

  const handleBack = () => {
    prevStep();
  };


  // Helper function to clean up empty inputs before AI requests
  const cleanupEmptyInputs = () => {
    // Clean up causes
    const filteredCauses = causes.filter((c) => c.cause.trim() !== "");
    if (filteredCauses.length !== causes.length) {
      setCauses(filteredCauses.length > 0 ? filteredCauses : [{ id: "cause-0", cause: "", isRootCause: false }]);
    }

    // Clean up perpetuations
    const filteredPerpetuations = perpetuations.filter((p) => p.text.trim() !== "");
    if (filteredPerpetuations.length !== perpetuations.length) {
      setPerpetuations(filteredPerpetuations.length > 0 ? filteredPerpetuations : [{ id: 1, text: "" }]);
    }

    // Clean up solutions (remove empty actions)
    const filteredSolutions = Object.fromEntries(
      Object.entries(solutions)
        .map(([id, actions]) => [id, actions.filter(action => action.trim() !== "")])
        .filter(([_, actions]) => (actions as string[]).length > 0)
    );
    if (Object.keys(filteredSolutions).length !== Object.keys(solutions).length) {
      setSolutions(filteredSolutions);
    }

    // Clean up fears (remove empty fear entries)
    const filteredFears = Object.fromEntries(
      Object.entries(fears).filter(([_, fear]) =>
        fear.risk.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
      )
    );
    if (Object.keys(filteredFears).length !== Object.keys(fears).length) {
      setFears(filteredFears);
      // Also update open fear sections to only include those with content
      setOpenFearSections(prev =>
        prev.filter(id => filteredFears[id] &&
          (filteredFears[id].risk.trim() !== "" ||
           filteredFears[id].mitigation.trim() !== "" ||
           filteredFears[id].contingency.trim() !== "")
        )
      );
    }
  };

  // Helper function to compare session data for caching
  const sessionDataEquals = (data1: SessionData | null, data2: SessionData): boolean => {
    if (!data1) return false;
    
    return (
      data1.pain_point === data2.pain_point &&
      JSON.stringify(data1.causes) === JSON.stringify(data2.causes) &&
      JSON.stringify(data1.perpetuations) === JSON.stringify(data2.perpetuations) &&
      JSON.stringify(data1.solutions) === JSON.stringify(data2.solutions) &&
      JSON.stringify(data1.fears) === JSON.stringify(data2.fears) &&
      data1.action_plan === data2.action_plan
    );
  };

  const handleSubmit = async () => {
    // Build current session data
    const filteredCauses = causes.filter((c) => c.cause.trim() !== "");

    const currentSessionData: SessionData = {
      pain_point: painPoint,
      causes: filteredCauses.map((c) => c.cause),
      assumptions: [], // No longer using assumptions
      perpetuations: perpetuations
        .map((p) => p.text)
        .filter((perpetuation) => perpetuation.trim() !== ""),
      solutions: Object.values(solutions).flat().filter((solution) => solution.trim() !== ""),
      fears: Object.values(fears).filter(
        (fear) => fear.risk.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
      ).map(fear => ({
        name: fear.risk, // Convert back to expected format for backend
        mitigation: fear.mitigation,
        contingency: fear.contingency
      })),
      action_plan:
        actionPlan.selectedActionIds.includes("other")
          ? actionPlan.otherActionText
          : actionPlan.selectedActionIds.length > 0
          ? actionPlan.selectedActionIds
              .filter(id => id !== "other")
              .map(id => solutions[id] || "")
              .join("; ")
          : "",
    };

    // Check if session data has changed since last summary generation
    if (sessionDataEquals(cachedSessionData, currentSessionData) && cachedSummary) {
      // Use cached summary
      summaryDownloader.summaryData = cachedSummary;
      setShowSummaryModal(true);
      return;
    }

    // Generate new summary
    const summary = await summaryDownloader.generateSummary(sessionId, currentSessionData, aiInteractionLog);
    if (summary) {
      // Cache the session data and summary
      setCachedSessionData(currentSessionData);
      setCachedSummary(summaryDownloader.summaryData);
      setShowSummaryModal(true);
    } else if (summaryDownloader.error) {
      setSubmitError(summaryDownloader.error);
    }
  };

  const saveToHistory = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const filteredCauses = causes.filter((c) => c.cause.trim() !== "");

      const sessionData = {
        session_id: sessionId,
        pain_point: painPoint,
        causes: filteredCauses.map((c) => c.cause),
        assumptions: [], // No longer using assumptions
        perpetuations: perpetuations
          .map((p) => p.text)
          .filter((perpetuation) => perpetuation.trim() !== ""),
        solutions: Object.values(solutions).flat().filter((solution) => solution.trim() !== ""),
        fears: Object.values(fears).filter(
          (fear) => fear.risk.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
        ).map(fear => ({
          name: fear.risk, // Convert back to expected format for backend
          mitigation: fear.mitigation,
          contingency: fear.contingency
        })),
        action_plan:
          actionPlan.selectedActionIds.includes("other")
            ? actionPlan.otherActionText
            : actionPlan.selectedActionIds.length > 0
            ? actionPlan.selectedActionIds
                .filter(id => id !== "other")
                .flatMap(id => solutions[id] || [])
                .join("; ")
            : "",
        ai_summary: summaryDownloader.summaryData || null,
      };

      console.log("Saving session data:", sessionData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
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

  const closeSummaryModal = () => {
    // Build current session data for caching consistency
    const filteredCauses = causes.filter((c) => c.cause.trim() !== "");

    const currentSessionData: SessionData = {
      pain_point: painPoint,
      causes: filteredCauses.map((c) => c.cause),
      assumptions: [], // No longer using assumptions
      perpetuations: perpetuations
        .map((p) => p.text)
        .filter((perpetuation) => perpetuation.trim() !== ""),
      solutions: Object.values(solutions).flat().filter((solution) => solution.trim() !== ""),
      fears: Object.values(fears).filter(
        (fear) => fear.risk.trim() !== "" || fear.mitigation.trim() !== "" || fear.contingency.trim() !== ""
      ).map(fear => ({
        name: fear.risk, // Convert back to expected format for backend
        mitigation: fear.mitigation,
        contingency: fear.contingency
      })),
      action_plan:
        actionPlan.selectedActionIds.includes("other")
          ? actionPlan.otherActionText
          : actionPlan.selectedActionIds.length > 0
          ? actionPlan.selectedActionIds
              .filter(id => id !== "other")
              .flatMap(id => solutions[id] || [])
              .join("; ")
          : "",
    };

    // Cache the session data and summary for consistency
    setCachedSessionData(currentSessionData);
    setCachedSummary(summaryDownloader.summaryData);
    
    setShowSummaryModal(false);
  };

  const returnToSession = () => {
    closeSummaryModal();
  };

  const downloadAsPDF = async () => {
    await summaryDownloader.downloadAsPDF(sessionId);
  };

  const shareOnSocial = async () => {
    await summaryDownloader.saveAsImage(sessionId);
  };


const syncTextareaHeights = (e: React.FormEvent<HTMLTextAreaElement>) => {
  const textarea = e.currentTarget;
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
      {analyzingCauseId && (
        <CauseAnalysisModal
          causeId={analyzingCauseId}
          causeText={causes.find(c => c.id === analyzingCauseId)?.cause || ''}
          history={causeAnalysisHistories[analyzingCauseId] || []}
          totalCauses={causes.filter(c => c.cause.trim() !== '').length}
          painPoint={painPoint}
          onClose={(selections: string[]) => {
            if (selections.length > 0) {
              // Handle root cause selections - this function will manage analyzedCauseIds internally
              handleRootCauseSelections(analyzingCauseId!, selections);
            }
            setAnalyzingCauseId(null);
          }}
        />
      )}
      
      {planningActionId && (
        <ActionPlanningModal
          causeId={planningActionId}
          causeText={actionableItems.find(item => item.id === planningActionId)?.cause || ''}
          isContribution={planningActionId.startsWith('perp-')}
          history={actionPlanningHistories[planningActionId] || []}
          sessionContext={{
            pain_point: painPoint,
            causes: causes.filter(c => c.cause.trim() !== '').map(c => c.cause),
            perpetuations: perpetuations.filter(p => selectedPerpetuations.includes(String(p.id))).map(p => p.text),
            solutions: Object.values(solutions).flat().filter(s => s.trim() !== ''),
            fears: Object.values(fears).filter(f => f.risk.trim() !== '' || f.mitigation.trim() !== '' || f.contingency.trim() !== '')
          }}
          onClose={(finalActions) => handleActionPlanning(planningActionId, finalActions)}
        />
      )}
      
      {fearsAnalysisActionId && (
        <FearsAnalysisModal
          actionId={fearsAnalysisActionId}
          actionText={Object.entries(solutions).flatMap(([id, actions]) =>
            actions.map((action, index) => ({ id: `${id}-${index}`, action }))
          ).find(item => item.id === fearsAnalysisActionId)?.action || ''}
          painPoint={painPoint}
          contributingCause={actionableItems.find(item => item.id === fearsAnalysisActionId)?.cause || ''}
          onClose={(answers) => handleFearsAnalysis(fearsAnalysisActionId, answers)}
        />
      )}
      <style>{`
        .selectable-item .read-only-textarea {
          pointer-events: none;
        }
        .my-contributions-section {
        }
        .my-contributions-section .item-label {
          margin-bottom: 4px !important;
        }
        
        /* Guidance hint styles */
        .guidance-hint-container {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }
        .guidance-hint {
          background-color: var(--guidance-hint-bg);
          border: 1px solid var(--golden-mustard);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          max-width: 500px;
          text-align: center;
        }
        .guidance-hint p {
          margin: 0;
        }
        
        /* Highlighted button styles */
        .help-me-nuudle-button-container.highlighted {
          animation: pulse-glow 2s infinite;
          border-radius: 12px;
        }
        .pulse-once {
          animation: pulse-glow-once 2s 1;
        }
        .landing-button.highlighted {
          box-shadow: 0 0 0 3px var(--refined-balance-teal-focus);
          border-color: var(--refined-balance-teal);
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 var(--refined-balance-teal-focus);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(65, 173, 176, 0.1);
          }
        }
        @keyframes pulse-glow-once {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        /* Skip button styles */
        .skip-button {
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          color: var(--text-secondary);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }
        
        .skip-button:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--golden-mustard);
        }
        
        .skip-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Root cause badge styles - exactly match AI assist button structure */
        .target-icon-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          transform: translate(-25%, -40%);
          z-index: 10;
          pointer-events: none;
        }
        
        .target-icon {
          color: white;
        }
        
        .root-cause-badge {
          padding: 4px 12px;
          background: radial-gradient(ellipse at center, rgba(65, 173, 176, 0.2) 30%, rgba(65, 173, 176, 0.4) 100%);
          border: 1px solid var(--refined-balance-teal);
          border-radius: 20px;
          color: var(--refined-balance-teal);
          font-weight: 500;
          font-size: 12px;
          display: inline-block;
          position: relative;
          box-shadow: 0 2px 4px rgba(65, 173, 176, 0.3);
        }
      `}</style>
      <main className="wizard-container">
        <div className="content-wrapper" ref={contentWrapperRef}>
        {/* Step 0: Problem Articulation */}
        <div className={getStepClass(0)} ref={(el) => { stepRefs.current[0] = el; }}>
          <h1 ref={(el) => { headerRefs.current[0] = el; }}>Nuudle</h1>
          <h2 className="subheader">Mind Matters</h2>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <div className="items-container">
<div className="deletable-item-container">
  <textarea
    ref={painPointTextareaRef}
    value={painPoint}
    onChange={(e) => {
      setPainPoint(e.target.value);
      // Clear guidance hint when user starts typing
      setShowGuidanceHint(false);
      // Clear all possible problem articulation stages since we don't know which one will be used
      ai.clearResponseForStage('problem_articulation_direct');
      ai.clearResponseForStage('problem_articulation_intervention');
      ai.clearResponseForStage('problem_articulation_context_aware');
    }}
    onInput={(e) => syncTextareaHeights(e)}
    className="auto-resizing-textarea"
    placeholder="What problem would you like to work through today?"
    disabled={step !== 0}
    style={{
      textAlign: 'center',
      paddingLeft: '1.25em',
      paddingRight: '1.25em'
    }}
  />
</div>
              </div>
              {showGuidanceHint && (
                <div className="guidance-hint-container mt-2">
                  <div className="guidance-hint">
                    <p>
                      {isInputGoalOriented(painPoint)
                        ? guidanceHintShownCount === 1
                          ? "To get the most out of this process, try describing the problem you're facing rather than the goal you want to achieve. For example, instead of 'I want to sleep better,' try 'I struggle to fall asleep at night.' Click \"Help Me Nuudle\" for assistance with this."
                          : "Remember to focus on the problem itself rather than your desired outcome. Click \"Help Me Nuudle\" for guidance on reframing your statement."
                        : guidanceHintShownCount === 1
                          ? "Please add more detail to your problem statement to proceed, or click \"Help Me Nuudle\" for assistance."
                          : "That's a good start, but more context is still needed to continue. Try to be more specific, or click \"Help Me Nuudle\" for guidance."
                      }
                    </p>
                  </div>
                </div>
              )}
              <div className="button-container justify-start mt-2">
              </div>
            </div>
          </div>
          <div className="button-container">
            <HelpMeNuudleButton
              onClick={() => {
                // Clear guidance hint when AI is triggered
                setShowGuidanceHint(false);
                // Determine the correct stage based on whether input is goal-oriented
                const stage = isInputGoalOriented(painPoint)
                  ? "problem_articulation_intervention_goal"
                  : "problem_articulation_intervention";
                // Pass force_guidance flag when guidance hint was shown (problem was flagged as simplistic)
                ai.requestAssistance(stage, painPoint, { painPoint }, showGuidanceHint);
              }}
              isLoading={ai.loadingStage === 'problem_articulation_direct' || ai.loadingStage === 'problem_articulation_intervention' || ai.loadingStage === 'problem_articulation_intervention_goal' || ai.loadingStage === 'problem_articulation_context_aware'}
              disabled={!painPoint.trim() || !ai.canUseAI('problem_articulation_direct')}
              currentStep={step}
              buttonStep={0}
              isHighlighted={showGuidanceHint}
            />
            <Tooltip text="Enter a problem statement to proceed." isDisabled={step === 0 && (!painPoint.trim() || isValidatingProblem)}>
              <button
                type="button"
                onClick={startSession}
                disabled={step !== 0 || !painPoint.trim() || isValidatingProblem}
                className="landing-button"
              >
                {isValidatingProblem ? "Validating..." : "Begin"}
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {validationError && (
            <div className="error-container" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
              <p style={{ color: '#c00', margin: 0 }}>Validation Error: {validationError}</p>
              <button
                onClick={() => setValidationError(null)}
                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: 'transparent', border: '1px solid #c00', color: '#c00', borderRadius: '4px', cursor: 'pointer' }}
              >
                Dismiss
              </button>
            </div>
          )}
          {ai.getCurrentResponse() && step === 0 && (
            <AIResponseCard
              response={ai.getCurrentResponse()!}
              stage={ai.loadingStage === 'problem_articulation_direct' ? 'problem_articulation_direct' :
                     ai.loadingStage === 'problem_articulation_intervention' ? 'problem_articulation_intervention' :
                     ai.loadingStage === 'problem_articulation_intervention_goal' ? 'problem_articulation_intervention_goal' :
                     'problem_articulation_context_aware'}
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI('problem_articulation_direct')}
            />
          )}
        </div>

        {/* Step 1: Contributing Causes */}
        <div className={getStepClass(1)} ref={(el) => { stepRefs.current[1] = el; }}>
          <h1 ref={(el) => { headerRefs.current[1] = el; }}>Why do you think this problem is happening?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description">
                <p>
                  Every effect has a cause that precedes it. Your problem is the effect. Start by brainstorming the causes you think might be contributing to your problem. After you're done, click submit and the AI assistant will become available to help you uncover the true root causes.
                </p>
              </label>
              <div className="items-container">
                {causes.map((item, index) => (
                  <div key={item.id} className="deletable-item-container">
                    <textarea
                      ref={(el) => {
                        causeTextAreaRefs.current[index] = el;
                      }}
                      value={item.cause}
                      onChange={(e) => {
                        handleCauseChange(index, e.target.value);
                        ai.clearResponseForStage('root_cause');
                      }}
                      onInput={(e) => syncTextareaHeights(e)}
                      className="auto-resizing-textarea"
                      placeholder={`Contributing Cause ${index + 1}`}
                      disabled={step !== 1}
                      style={{
                        textAlign: 'center',
                        paddingLeft: '1.25em',
                        paddingRight: '1.25em'
                      }}
                    />
                    {causes.length > 1 && (
                      <div className="delete-button-wrapper">
                        <button type="button" className="delete-item-button" onClick={() => removeCause(index)} disabled={step !== 1}>
                          &times;
                        </button>
                      </div>
                    )}
                    {causesSubmitted && !item.isRootCause && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                        <div style={{ position: 'relative', zIndex: 10 }} className={playCauseAnimation ? 'pulse-once' : ''}>
                          <AIAssistButton
                            stage="root_cause"
                            customButtonText="Help me find the root cause"
                            isLoading={analyzingCauseId === item.id}
                            onRequest={() => setAnalyzingCauseId(item.id)}
                            disabled={step !== 1 || !item.cause.trim() || !causesSubmitted}
                            sessionId={sessionId}
                            context={{ causes }}
                            currentStep={step}
                            buttonStep={1}
                            causesSubmitted={causesSubmitted}
                            causeText={item.cause}
                          />
                        </div>
                      </div>
                    )}
                    {causesSubmitted && item.isRootCause && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                          <div className="target-icon-wrapper">
                            <Target size={16} className="target-icon" />
                          </div>
                          <div className="root-cause-badge">
                            Root cause found!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
            <Tooltip
              text={causesSubmitted ? "Proceed to the next step" : "Submit your causes to enable AI analysis"}
              isDisabled={step === 1 && !(causes.length > 0 && causes[0].cause.trim() !== "")}
            >
              <button
                type="button"
                onClick={() => {
                  if (causesSubmitted) {
                    nextStep();
                  } else {
                    // Filter out empty causes when submitting
                    const filteredCauses = causes.filter(c => c.cause.trim() !== "");
                    if (filteredCauses.length > 0) {
                      setCauses(filteredCauses);
                    }
                    setCausesSubmitted(true);
                    setPlayCauseAnimation(true);
                    setTimeout(() => setPlayCauseAnimation(false), 4000);
                  }
                }}
                disabled={step !== 1 || (causes.length > 0 && causes[0].cause.trim() === "") || isAnalyzingSelfAwareness}
              >
                {isAnalyzingSelfAwareness ? "Analyzing..." : (causesSubmitted ? "Next" : "Submit")}
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.getCurrentResponse() && step === 1 && (
            <AIResponseCard
              response={ai.getCurrentResponse()!}
              stage={ai.lastAttemptedStage || ai.loadingStage || "root_cause"}
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI('root_cause')}
            />
          )}
        </div>

        {/* Step 2: My Contributions (conditionally shown) */}
        {showMyContributions && (
          <div className={getStepClass(2)} ref={(el) => { stepRefs.current[2] = el; }}>
            <h1 ref={(el) => { headerRefs.current[2] = el; }}>Let's consider your role in the problem.</h1>
            <p className="step-description">Sometimes, our own habits or reactions can unintentionally keep a problem going. Can you think of any actions you take that might be contributing?</p>
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
                        onChange={(e) => {
                          handlePerpetuationChange(perpetuation.id, e.target.value);
                          ai.clearResponseForStage('perpetuation');
                        }}
                        onInput={(e) => syncTextareaHeights(e)}
                        className="auto-resizing-textarea"
                        placeholder={`My Contribution ${index + 1}`}
                        disabled={step !== 2}
                        style={{
                          textAlign: 'center',
                          paddingLeft: '1.25em',
                          paddingRight: '1.25em'
                        }}
                      />
                      {perpetuations.length > 1 && (
                        <div className="delete-button-wrapper">
                          <button type="button" className="delete-item-button" onClick={() => removePerpetuation(perpetuation.id)} disabled={step !== 2}>
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="ai-button-container mt-2">
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <AIAssistButton
                      stage="perpetuation"
                      customButtonText="Help me reflect on my potential role"
                      isLoading={ai.loadingStage === 'perpetuation'}
                      onRequest={() => ai.requestAssistance("perpetuation", perpetuations.map(p => p.text).join(', '), { painPoint, causes, perpetuations })}
                      disabled={!ai.canUseAI('perpetuation') || !perpetuations.some(p => p.text.trim() !== "")}
                      sessionId={sessionId}
                      context={{ perpetuations }}
                      currentStep={step}
                      buttonStep={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="button-container" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={prevStep} disabled={step !== 2}>
                Back
              </button>
              {perpetuations.length < 3 && (
                <button type="button" onClick={addPerpetuation} disabled={step !== 2 || (perpetuations.length > 0 && perpetuations[perpetuations.length - 1].text.trim() === "")}>
                  Add another contribution
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  // Clear perpetuations and skip this step
                  setPerpetuations([{ id: 1, text: "" }]);
                  setSelectedPerpetuations([]);
                  nextStep();
                }}
                disabled={step !== 2}
                className="skip-button"
              >
                I'm not sure / Skip for now
              </button>
              <button
                type="button"
                onClick={() => {
                  // Filter filled perpetuations and mark them as selected
                  const filledPerpetuations = perpetuations.filter(p => p.text.trim() !== "");
                  setPerpetuations(filledPerpetuations.length > 0 ? filledPerpetuations : [{ id: 1, text: "" }]);
                  setSelectedPerpetuations(filledPerpetuations.map(p => String(p.id)));
                  nextStep();
                }}
                disabled={step !== 2}
              >
                Next
              </button>
            </div>
            {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
            {ai.getCurrentResponse() && step === 2 && (
              <AIResponseCard
                response={ai.getCurrentResponse()!}
                stage="perpetuation"
                onDismiss={ai.dismissResponse}
                onFeedback={ai.provideFeedback}
                canFollowUp={ai.canUseAI('perpetuation')}
              />
            )}
          </div>
        )}

        {/* Step 3: Solutions */}
        <div className={getStepClass(3)} ref={(el) => { stepRefs.current[3] = el; }}>
          <h1 ref={(el) => { headerRefs.current[3] = el; }}>What can you do about it?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description">
                Click the 'Help me create an action plan' button for each cause you want to address below.
              </label>
              
              {/* Root Causes Section */}
              {actionableItems.filter(item => !item.id.startsWith('perp-') && causes.find(c => c.id === item.id)?.isRootCause).length > 0 && (
                <>
                  <h4 style={{ display: 'block', margin: '0.5rem 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', textAlign: 'center', fontWeight: '600' }}>
                    Root Causes
                  </h4>
                  <p style={{ display: 'block', margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                    These causes have been validated by first principles analysis and are more likely to be the primary drivers of the issue.
                  </p>
                  <div className="items-container">
                    {actionableItems.filter(item => !item.id.startsWith('perp-') && causes.find(c => c.id === item.id)?.isRootCause).map((item) => {
                      const isContribution = item.id.startsWith('perp-');
                      const hasActions = solutions[item.id] && solutions[item.id].length > 0 && solutions[item.id].some(action => action.trim() !== '');
                      
                      return hasActions ? (
                        <div key={item.id}>
                          {/* Parent container with border when actions exist */}
                          <div className="cause-action-container" style={{
                            border: '1px solid var(--golden-mustard)',
                            borderRadius: '12px',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-primary)'
                          }}>
                            {/* Cause/Contribution Display */}
                            <div className="deletable-item-container" style={{ marginBottom: '1rem' }}>
                              <textarea
                                className="auto-resizing-textarea"
                                value={item.cause}
                                readOnly
                                style={{
                                  background: 'var(--bg-secondary)',
                                  cursor: 'default',
                                  textAlign: 'center',
                                  paddingLeft: '1.25em',
                                  paddingRight: '1.25em'
                                }}
                              />
                            </div>
                            
                            {/* Actions Section */}
                            <div>
                              <label className="item-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Planned Action{solutions[item.id] && solutions[item.id].length > 1 ? 's' : ''}
                              </label>
                              {(solutions[item.id] || []).map((action, actionIndex) => (
                                <div key={actionIndex} className="deletable-item-container" style={{ marginBottom: actionIndex < (solutions[item.id] || []).length - 1 ? '0.5rem' : '0' }}>
                                  <textarea
                                    ref={el => { solutionTextareaRefs.current.set(`${item.id}-${actionIndex}`, el); }}
                                    value={action}
                                    onChange={(e) => {
                                      handleSolutionActionChange(item.id, actionIndex, e.target.value);
                                      ai.clearResponseForStage('potential_actions');
                                    }}
                                    onInput={(e) => syncTextareaHeights(e)}
                                    className="auto-resizing-textarea"
                                    placeholder="Your planned action"
                                    disabled={step !== 3}
                                    style={{
                                      background: 'var(--bg-secondary)',
                                      borderColor: 'var(--refined-balance-teal)',
                                      boxShadow: '0 0 0 1px var(--refined-balance-teal-light)',
                                      textAlign: 'center',
                                      paddingLeft: '1.25em',
                                      paddingRight: '1.25em'
                                    }}
                                  />
                                  <div className="delete-button-wrapper">
                                    <button
                                      type="button"
                                      className="delete-item-button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeSolutionAction(item.id, actionIndex);
                                      }}
                                      disabled={step !== 3}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              
                              {/* AI Assist Button - left aligned underneath the action text areas */}
                              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                                <div style={{ position: 'relative', zIndex: 10 }}>
                                  <AIAssistButton
                                    stage="action_planning"
                                    customButtonText="Help me create an action plan"
                                    isLoading={planningActionId === item.id}
                                    onRequest={() => setPlanningActionId(item.id)}
                                    disabled={step !== 3 || !item.cause.trim() || hasActions}
                                    sessionId={sessionId}
                                    context={{ cause: item.cause, isContribution: isContribution }}
                                    currentStep={step}
                                    buttonStep={3}
                                    hasExistingAction={hasActions}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Structure matching Step 1 for consistent spacing */
                        <div key={item.id} className="deletable-item-container">
                          {/* Cause/Contribution Display */}
                          <textarea
                            className="auto-resizing-textarea"
                            value={item.cause}
                            readOnly
                            style={{
                              background: 'var(--bg-secondary)',
                              cursor: 'default',
                              textAlign: 'center',
                              paddingLeft: '1.25em',
                              paddingRight: '1.25em'
                            }}
                          />
                          
                          {/* Plan Action Button */}
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                            <div style={{ position: 'relative', zIndex: 10 }}>
                              <AIAssistButton
                                stage="action_planning"
                                customButtonText="Help me create an action plan"
                                isLoading={planningActionId === item.id}
                                onRequest={() => setPlanningActionId(item.id)}
                                disabled={step !== 3 || !item.cause.trim()}
                                sessionId={sessionId}
                                context={{ cause: item.cause, isContribution: isContribution }}
                                currentStep={step}
                                buttonStep={3}
                                hasExistingAction={false}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              
              {/* Contributing Causes Section */}
              {actionableItems.filter(item => item.id.startsWith('perp-') || !causes.find(c => c.id === item.id)?.isRootCause).length > 0 && (
                <>
                  <h4 style={{ display: 'block', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)', textAlign: 'center', fontWeight: '600' }}>
                    Contributing Causes
                 </h4>
                 <p style={{ display: 'block', margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                   These causes have not been validated by root cause analysis and are less likely to be the primary drivers of the issue.
                 </p>
                 <div className="items-container">
                    {actionableItems.filter(item => item.id.startsWith('perp-') || !causes.find(c => c.id === item.id)?.isRootCause).map((item) => {
                      const isContribution = item.id.startsWith('perp-');
                      const hasActions = solutions[item.id] && solutions[item.id].length > 0 && solutions[item.id].some(action => action.trim() !== '');
                      
                      return hasActions ? (
                        <div key={item.id}>
                          {/* Parent container with border when actions exist */}
                          <div className="cause-action-container" style={{
                            border: '1px solid var(--golden-mustard)',
                            borderRadius: '12px',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-primary)'
                          }}>
                            {/* Cause/Contribution Display */}
                            <div className="deletable-item-container" style={{ marginBottom: '1rem' }}>
                              <textarea
                                className="auto-resizing-textarea"
                                value={item.cause}
                                readOnly
                                style={{
                                  background: 'var(--bg-secondary)',
                                  cursor: 'default',
                                  textAlign: 'center',
                                  paddingLeft: '1.25em',
                                  paddingRight: '1.25em'
                                }}
                              />
                            </div>
                            
                            {/* Actions Section */}
                            <div>
                              <label className="item-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Planned Action{solutions[item.id] && solutions[item.id].length > 1 ? 's' : ''}
                              </label>
                              {(solutions[item.id] || []).map((action, actionIndex) => (
                                <div key={actionIndex} className="deletable-item-container" style={{ marginBottom: actionIndex < (solutions[item.id] || []).length - 1 ? '0.5rem' : '0' }}>
                                  <textarea
                                    ref={el => { solutionTextareaRefs.current.set(`${item.id}-${actionIndex}`, el); }}
                                    value={action}
                                    onChange={(e) => {
                                      handleSolutionActionChange(item.id, actionIndex, e.target.value);
                                      ai.clearResponseForStage('potential_actions');
                                    }}
                                    onInput={(e) => syncTextareaHeights(e)}
                                    className="auto-resizing-textarea"
                                    placeholder="Your planned action"
                                    disabled={step !== 3}
                                    style={{
                                      background: 'var(--bg-secondary)',
                                      borderColor: 'var(--refined-balance-teal)',
                                      boxShadow: '0 0 0 1px var(--refined-balance-teal-light)',
                                      textAlign: 'center',
                                      paddingLeft: '1.25em',
                                      paddingRight: '1.25em'
                                    }}
                                  />
                                  <div className="delete-button-wrapper">
                                    <button
                                      type="button"
                                      className="delete-item-button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeSolutionAction(item.id, actionIndex);
                                      }}
                                      disabled={step !== 3}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              
                              {/* AI Assist Button - left aligned underneath the action text areas */}
                              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                                <div style={{ position: 'relative', zIndex: 10 }}>
                                  <AIAssistButton
                                    stage="action_planning"
                                    customButtonText="Help me create an action plan"
                                    isLoading={planningActionId === item.id}
                                    onRequest={() => setPlanningActionId(item.id)}
                                    disabled={step !== 3 || !item.cause.trim() || hasActions}
                                    sessionId={sessionId}
                                    context={{ cause: item.cause, isContribution: isContribution }}
                                    currentStep={step}
                                    buttonStep={3}
                                    hasExistingAction={hasActions}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Structure matching Step 1 for consistent spacing */
                        <div key={item.id} className="deletable-item-container">
                          {/* Cause/Contribution Display */}
                          <textarea
                            className="auto-resizing-textarea"
                            value={item.cause}
                            readOnly
                            style={{
                              background: 'var(--bg-secondary)',
                              cursor: 'default',
                              textAlign: 'center',
                              paddingLeft: '1.25em',
                              paddingRight: '1.25em'
                            }}
                          />
                          
                          {/* Plan Action Button */}
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                            <div style={{ position: 'relative', zIndex: 10 }}>
                              <AIAssistButton
                                stage="action_planning"
                                customButtonText="Help me create an action plan"
                                isLoading={planningActionId === item.id}
                                onRequest={() => setPlanningActionId(item.id)}
                                disabled={step !== 3 || !item.cause.trim()}
                                sessionId={sessionId}
                                context={{ cause: item.cause, isContribution: isContribution }}
                                currentStep={step}
                                buttonStep={3}
                                hasExistingAction={false}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 3}>
              Back
            </button>
            <Tooltip text="Use AI guidance to plan at least one action to proceed." isDisabled={step === 3 && Object.values(solutions).some((actions) => actions.some(action => action.trim() !== ""))}>
              <button type="button" onClick={() => {
                // Filter out empty solutions before proceeding
                const filteredSolutions = Object.fromEntries(
                  Object.entries(solutions)
                    .map(([id, actions]) => [id, actions.filter(action => action.trim() !== "")])
                    .filter(([_, actions]) => (actions as string[]).length > 0)
                );
                setSolutions(filteredSolutions);
                nextStep();
              }} disabled={step !== 3 || !Object.values(solutions).some((actions) => actions.some(action => action.trim() !== ""))}>
                Next
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.getCurrentResponse() && step === 3 && (
            <AIResponseCard
              response={ai.getCurrentResponse()!}
              stage="potential_actions"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI('potential_actions')}
            />
          )}
        </div>

        {/* Step 4: Fears */}
        <div className={getStepClass(4)} ref={(el) => { stepRefs.current[4] = el; }}>
          <h1 ref={(el) => { headerRefs.current[4] = el; }}>What worries you?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description">
                Click the 'Help me process my concerns' button for each action you want to address below.
              </label>
              
              <div className="items-container">
                {Object.entries(solutions).flatMap(([id, actions]) =>
                  actions.map((action, index) => ({ id: `${id}-${index}`, action }))
                ).map(({ id, action }) => {
                  const hasFearsData = fears[id] && (fears[id].risk.trim() !== '' || fears[id].mitigation.trim() !== '' || fears[id].contingency.trim() !== '');
                  
                  return hasFearsData ? (
                    <div key={id}>
                      {/* Parent container with border when fears data exists */}
                      <div className="cause-action-container" style={{
                        border: '1px solid var(--golden-mustard)',
                        borderRadius: '12px',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-primary)'
                      }}>
                        {/* Action Display */}
                        <div className="deletable-item-container" style={{ marginBottom: '1rem' }}>
                          <textarea
                            className="auto-resizing-textarea"
                            value={action}
                            readOnly
                            style={{
                              background: 'var(--bg-secondary)',
                              cursor: 'default',
                              textAlign: 'center',
                              paddingLeft: '1.25em',
                              paddingRight: '1.25em'
                            }}
                          />
                        </div>
                        
                        {/* Fears Analysis Results Section */}
                        <div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label className="item-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              Risk
                            </label>
                            <textarea
                              ref={el => {
                                const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                                fearTextareaRefs.current.set(id, { ...refs, name: el });
                              }}
                              value={fears[id]?.risk || ''}
                              onChange={(e) => {
                                handleFearChange(id, "risk", e.target.value);
                              }}
                              onInput={(e) => syncTextareaHeights(e)}
                              className="auto-resizing-textarea"
                              placeholder="What could go wrong?"
                              disabled={step !== 4}
                              style={{
                                background: 'var(--bg-secondary)',
                                borderColor: 'var(--refined-balance-teal)',
                                boxShadow: '0 0 0 1px var(--refined-balance-teal-light)',
                                textAlign: 'center',
                                paddingLeft: '1.25em',
                                paddingRight: '1.25em'
                              }}
                            />
                          </div>
                          
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label className="item-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              Mitigation
                            </label>
                            <textarea
                              ref={el => {
                                const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                                fearTextareaRefs.current.set(id, { ...refs, mitigation: el });
                              }}
                              value={fears[id]?.mitigation || ''}
                              onChange={(e) => {
                                handleFearChange(id, "mitigation", e.target.value);
                              }}
                              onInput={(e) => syncTextareaHeights(e)}
                              className="auto-resizing-textarea"
                              placeholder="How to prevent it?"
                              disabled={step !== 4}
                              style={{
                                background: 'var(--bg-secondary)',
                                borderColor: 'var(--refined-balance-teal)',
                                boxShadow: '0 0 0 1px var(--refined-balance-teal-light)',
                                textAlign: 'center',
                                paddingLeft: '1.25em',
                                paddingRight: '1.25em'
                              }}
                            />
                          </div>
                          
                          <div style={{ marginBottom: '0' }}>
                            <label className="item-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              Contingency
                            </label>
                            <textarea
                              ref={el => {
                                const refs = fearTextareaRefs.current.get(id) || { name: null, mitigation: null, contingency: null };
                                fearTextareaRefs.current.set(id, { ...refs, contingency: el });
                              }}
                              value={fears[id]?.contingency || ''}
                              onChange={(e) => {
                                handleFearChange(id, "contingency", e.target.value);
                              }}
                              onInput={(e) => syncTextareaHeights(e)}
                              className="auto-resizing-textarea"
                              placeholder="What to do if it happens?"
                              disabled={step !== 4}
                              style={{
                                background: 'var(--bg-secondary)',
                                borderColor: 'var(--refined-balance-teal)',
                                boxShadow: '0 0 0 1px var(--refined-balance-teal-light)',
                                textAlign: 'center',
                                paddingLeft: '1.25em',
                                paddingRight: '1.25em'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Structure matching Steps 1 and 3 for consistent spacing */
                    <div key={id} className="deletable-item-container">
                      {/* Action Display */}
                      <textarea
                        className="auto-resizing-textarea"
                        value={action}
                        readOnly
                        style={{
                          background: 'var(--bg-secondary)',
                          cursor: 'default',
                          textAlign: 'center',
                          paddingLeft: '1.25em',
                          paddingRight: '1.25em'
                        }}
                      />
                      
                      {/* Help me process my concerns Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                          <AIAssistButton
                            stage="action_planning"
                            customButtonText="Help me process my concerns"
                            isLoading={fearsAnalysisActionId === id}
                            onRequest={() => setFearsAnalysisActionId(id)}
                            disabled={step !== 4 || !action.trim()}
                            sessionId={sessionId}
                            context={{ action }}
                            currentStep={step}
                            buttonStep={4}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="not-worried"
                checked={notWorried}
                onChange={(e) => step === 4 && setNotWorried(e.target.checked)}
                disabled={step !== 4}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="not-worried" className="ml-2 block text-sm text-gray-900">
                I'm not worried about taking any of these actions
              </label>
            </div>
          </div>
          <div className="button-container" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={prevStep} disabled={step !== 4}>
              Back
            </button>
            <Tooltip text="Process your concerns or check the 'not worried' option to proceed." isDisabled={step === 4 && (!notWorried && !Object.values(fears).some((fear) => fear.risk.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))}>
              <button
                type="button"
                onClick={nextStep}
                disabled={step !== 4 || (!notWorried && !Object.values(fears).some((fear) => fear.risk.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))}
              >
                Next
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Step 5: Action Plan */}
        <div className={getStepClass(5)} ref={(el) => { stepRefs.current[5] = el; }}>
          <h1 ref={(el) => { headerRefs.current[5] = el; }}>What will you do about it?</h1>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <label className="step-description mb-4">Select the actions you're confident in then click Submit.</label>
              <div className="items-container">
                {Object.entries(solutions).flatMap(([id, actions]) =>
                  actions.map((action, index) => ({ id: `${id}-${index}`, action }))
                ).map(({ id, action }) => (
                  <div key={id} className="actionable-item-container">
                    <div
                      className={`selectable-box ${actionPlan.selectedActionIds.includes(id) ? "selected" : ""}`}
                      onClick={() => handleActionSelection(id)}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        paddingLeft: '40px',
                        paddingRight: '40px'
                      }}
                    >
                      {actionPlan.selectedActionIds.includes(id) && (
                        <Check
                          className="w-5 h-5 text-progress-complete"
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1
                          }}
                        />
                      )}
                      {action}
                    </div>
                  </div>
                ))}
                <div>
                  <textarea
                    ref={otherActionTextareaRef}
                    value={actionPlan.otherActionText}
                    onChange={(e) => {
                      handleOtherActionChange(e.target.value);
                      // No AI reset needed for action plan selection as there's no AI button for this step
                    }}
                    onInput={(e) => syncTextareaHeights(e)}
                    onFocus={handleOtherActionFocus}
                    className="auto-resizing-textarea"
                    placeholder="None of the above, I'd rather..."
                    disabled={step !== 5}
                    style={{
                      textAlign: 'center',
                      paddingLeft: '1.25em',
                      paddingRight: '1.25em',
                      opacity: actionPlan.selectedActionIds.includes("other") || actionPlan.otherActionText.trim() === "" ? 1 : 0.5
                    }}
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
              >
                {isSubmitting ? "Saving..." : sessionSaved ? "Saved!" : "Save to my history"}
              </button>
              <button
                type="button"
                onClick={returnToSession}
                className="action-button"
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

      {/* Cause Exchange Modal */}
      {showCauseExchangeModal && pendingSelections && (
        <div className="modal-overlay" onClick={() => setShowCauseExchangeModal(false)}>
          <div className="modal-content cause-exchange-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCauseExchangeModal(false)} className="modal-close-button">
            </button>
            
            <div className="cause-exchange-header">
              <h2>You've reached the 5-cause limit</h2>
              <p>To add your {pendingSelections.selections.length} new selection(s), please choose which of your current causes you'd like to replace:</p>
            </div>

            <div className="cause-exchange-content">
              <div className="new-selections-section">
                <h3>Your New Selections:</h3>
                <div className="new-selections-list">
                  {pendingSelections.selections.map((selection, index) => (
                    <div key={index} className="new-selection-item">
                      <div className="selection-indicator">{index + 1}</div>
                      <div className="selection-text">{selection}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="existing-causes-section">
                <h3>Select {pendingSelections.selections.length - 1} cause(s) to replace:</h3>
                <div className="existing-causes-list">
                  {causes
                    .filter(c => c.cause.trim() !== '' && c.id !== pendingSelections.analyzingCauseId)
                    .map((cause) => (
                      <div
                        key={cause.id}
                        className={`existing-cause-item ${selectedCausesToReplace.includes(cause.cause) ? 'selected' : ''}`}
                        onClick={() => {
                          const needed = pendingSelections.selections.length - 1;
                          const current = selectedCausesToReplace.length;
                          
                          if (selectedCausesToReplace.includes(cause.cause)) {
                            setSelectedCausesToReplace(prev => prev.filter(c => c !== cause.cause));
                          } else if (current < needed) {
                            setSelectedCausesToReplace(prev => [...prev, cause.cause]);
                          }
                        }}
                        style={{
                          cursor: selectedCausesToReplace.includes(cause.cause) ||
                                  selectedCausesToReplace.length < pendingSelections.selections.length - 1
                                  ? 'pointer' : 'not-allowed',
                          opacity: selectedCausesToReplace.includes(cause.cause) ||
                                   selectedCausesToReplace.length < pendingSelections.selections.length - 1
                                   ? 1 : 0.5
                        }}
                      >
                        <div className="cause-text">{cause.cause}</div>
                        {selectedCausesToReplace.includes(cause.cause) && (
                          <div className="selection-indicator selected">✓</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="cause-exchange-actions">
              <button
                onClick={() => setShowCauseExchangeModal(false)}
                className="cancel-button secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCauseExchange(selectedCausesToReplace)}
                disabled={selectedCausesToReplace.length !== pendingSelections.selections.length - 1}
                className="confirm-button primary"
              >
                Replace Causes
              </button>
            </div>

            <style jsx>{`
              .cause-exchange-modal {
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
              }

              .cause-exchange-header {
                text-align: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-medium);
              }

              .cause-exchange-header h2 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
                font-size: 1.5rem;
              }

              .cause-exchange-header p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 0.95rem;
              }

              .cause-exchange-content {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
              }

              .new-selections-section,
              .existing-causes-section {
                background: var(--bg-secondary);
                border-radius: 12px;
                padding: 1rem;
              }

              .new-selections-section h3,
              .existing-causes-section h3 {
                margin: 0 0 1rem 0;
                font-size: 1.1rem;
                color: var(--refined-balance-teal);
              }

              .new-selections-list,
              .existing-causes-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
              }

              .new-selection-item {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 0.75rem;
                background: var(--refined-balance-teal-light);
                border: 1px solid var(--refined-balance-teal);
                border-radius: 8px;
              }

              .existing-cause-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                background: var(--bg-primary);
                border: 1px solid var(--border-medium);
                border-radius: 8px;
                transition: all 0.2s ease;
                position: relative;
              }

              .existing-cause-item:hover:not([style*="not-allowed"]) {
                border-color: var(--golden-mustard);
                background: var(--golden-mustard-focus);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              .existing-cause-item.selected {
                border-color: var(--refined-balance-teal);
                background: var(--refined-balance-teal-light);
              }

              .selection-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--refined-balance-teal);
                color: white;
                font-size: 0.8rem;
                font-weight: bold;
                flex-shrink: 0;
              }

              .selection-indicator.selected {
                background: var(--refined-balance-teal);
                color: white;
              }

              .selection-text,
              .cause-text {
                flex: 1;
                font-size: 0.9rem;
                line-height: 1.4;
                color: var(--text-primary);
              }

              .cause-exchange-actions {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border-medium);
              }

              .cancel-button,
              .confirm-button {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              }

              .cancel-button {
                background: var(--bg-secondary);
                border: 1px solid var(--border-medium);
                color: var(--text-secondary);
              }

              .cancel-button:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
              }

              .confirm-button {
                background: var(--refined-balance-teal);
                border: 1px solid var(--refined-balance-teal);
                color: white;
              }

              .confirm-button:hover:not(:disabled) {
                background: var(--refined-balance-teal-dark);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(65, 173, 176, 0.3);
              }

              .confirm-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}</style>
          </div>
        </div>
      )}
      
    </main>
    </>
  );
}

export default function SessionWizard() {
  const [sessionId, setSessionId] = useState<string>("");
  
  // Initialize session ID - generate a valid ObjectId format for backend compatibility
  useEffect(() => {
    // Generate a 24-character hex string (valid ObjectId format)
    const generateObjectId = () => {
      const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      const randomHex = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return timestamp + randomHex;
    };
    
    setSessionId(generateObjectId());
  }, []);

  const logAIInteraction = (stage: string, userInputBefore: string, aiResponse: string) => {
    // This will be handled by the SessionWizardContent component
  };

  if (!sessionId) {
    return <div>Loading...</div>;
  }

  return (
    <AIAssistantProvider sessionId={sessionId} onInteractionLog={logAIInteraction}>
      <SessionWizardContent sessionId={sessionId} />
    </AIAssistantProvider>
  );
}