"use client";

import React, { useState, useEffect, useRef } from "react";
import Tooltip from "@/components/Tooltip";
import {
  HelpMeNuudleButton,
  AIAssistButton,
  AIResponseCard,
  AIErrorCard,
  SuggestedCause,
  useAIAssistant,
} from "@/components/AIComponents";

interface ActionableItem {
  id: string;
  cause: string;
  assumption?: string;
}

export default function SessionWizard() {
  const [painPoint, setPainPoint] = useState("");
  const [step, setStep] = useState(0);
  const [causes, setCauses] = useState([{ cause: "", assumption: "" }]);
  const [solutions, setSolutions] = useState<{ [id: string]: string }>({});
  const [actionableItems, setActionableItems] = useState<ActionableItem[]>([]);
  const [perpetuations, setPerpetuations] = useState<{ id: number; text: string }[]>([{ id: 1, text: "" }]);
  const [step2Phase, setStep2Phase] = useState<"input" | "selection">("input");
  const [selectedPerpetuations, setSelectedPerpetuations] = useState<string[]>([]);
  const [fears, setFears] = useState<{ [id: string]: { name: string; mitigation: string; contingency: string } }>({});
  const [notWorried, setNotWorried] = useState(false);
  const [suggestedCauses, setSuggestedCauses] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState<{
    selectedActionId: string | null;
    otherActionText: string;
    elaborationTexts: { [actionId: string]: string };
  }>({
    selectedActionId: null,
    otherActionText: "",
    elaborationTexts: {},
  });
  const [causeTextareaHeights, setCauseTextareaHeights] = useState<{ [key: number]: number }>({});
 
   const [sessionId, setSessionId] = useState<string>("");
   useEffect(() => {
     setSessionId(`session_${Date.now()}`);
  }, []);

  const ai = useAIAssistant(sessionId);

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const painPointTextareaRef = useRef<HTMLTextAreaElement>(null);
  const causeTextAreaRefs = useRef<Array<[HTMLTextAreaElement | null, HTMLTextAreaElement | null]>>([]);

  useEffect(() => {
    if (stepRefs.current[step]) {
      stepRefs.current[step]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    if (step === 0 && painPointTextareaRef.current) {
      setTimeout(() => {
        if (painPointTextareaRef.current) {
          syncTextareaHeights(painPointTextareaRef.current);
        }
      }, 0);
    }
    ai.dismissResponse();
  }, [step]);

  useEffect(() => {
    causeTextAreaRefs.current.forEach(pair => {
      if (pair[0] && pair[1]) {
        syncTextareaHeights(pair[0], pair[1]);
      }
    });
  }, [causes]);

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
      setFears({});
    }
  }, [notWorried]);

  useEffect(() => {
    if (ai.currentResponse && step === 3) {
      const causes = ai.currentResponse.split('\n').filter(c => c.trim() !== '' && c.startsWith('- ')).map(c => c.substring(2));
      setSuggestedCauses(causes);
    } else {
      setSuggestedCauses([]);
    }
  }, [ai.currentResponse, step]);

  const startSession = () => {
    if (painPoint.trim()) {
      setStep(1);
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
    if (solutions[id] === undefined) {
      setSolutions(prev => ({ ...prev, [id]: "" }));
    }
  };

  const removeSolutionAction = (id: string) => {
    setSolutions(prev => {
      const newSolutions = { ...prev };
      delete newSolutions[id];
      return newSolutions;
    });
  };

  const handleSolutionActionChange = (id: string, action: string) => {
    setSolutions((prev) => ({
      ...prev,
      [id]: action,
    }));
  };

  const handleFearSelection = (id: string) => {
    setFears(prev => {
      const newFears = { ...prev };
      if (newFears[id]) {
        delete newFears[id];
      } else {
        newFears[id] = { name: "", mitigation: "", contingency: "" };
      }
      return newFears;
    });
    setNotWorried(false);
  };

  const removeFearAction = (id: string) => {
    setFears(prev => {
      const newFears = { ...prev };
      delete newFears[id];
      return newFears;
    });
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
      selectedActionId: prev.selectedActionId === actionId ? null : actionId,
      otherActionText: ""
    }));
  };

  const handleOtherActionChange = (text: string) => {
    setActionPlan(prev => ({
      ...prev,
      selectedActionId: "other",
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
        actionPlan.selectedActionId === "other"
          ? actionPlan.otherActionText
          : actionPlan.selectedActionId
          ? `${
              solutions[actionPlan.selectedActionId] || ""
            }: ${actionPlan.elaborationTexts[actionPlan.selectedActionId] || ""}`
          : "",
    };

    try {
      const response = await fetch("http://localhost:8000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        console.log("Session saved successfully!");
        window.location.href = "/historypage";
      } else {
        console.error("Failed to save session:", response.status);
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const syncTextareaHeights = (
    element1: HTMLTextAreaElement,
    element2?: HTMLTextAreaElement,
    index?: number
  ) => {
    if (!element1) return;
 
    const autoResizeSingle = (el: HTMLTextAreaElement) => {
      const style = window.getComputedStyle(el);
      const minHeight = parseInt(style.minHeight, 10);
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      el.style.height = `${Math.max(scrollHeight, minHeight)}px`;
    };
 
    if (!element2) {
      autoResizeSingle(element1);
      return;
    }
 
    const style1 = window.getComputedStyle(element1);
    const minHeight1 = parseInt(style1.minHeight, 10);
    element1.style.height = "auto";
    const scrollHeight1 = element1.scrollHeight;
 
    const style2 = window.getComputedStyle(element2);
    const minHeight2 = parseInt(style2.minHeight, 10);
    element2.style.height = "auto";
    const scrollHeight2 = element2.scrollHeight;
 
    const finalHeight = Math.max(scrollHeight1, minHeight1, scrollHeight2, minHeight2);
 
    element1.style.height = `${finalHeight}px`;
    element2.style.height = `${finalHeight}px`;

    if (index !== undefined) {
      setCauseTextareaHeights(prev => ({ ...prev, [index]: finalHeight }));
    }
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
    <main className="wizard-container">
      <div className="content-wrapper" ref={contentWrapperRef}>
        {/* Step 0: Problem Articulation */}
        <div className={getStepClass(0)} ref={(el) => { stepRefs.current[0] = el; }}>
          <h1>Nuudle</h1>
          <h2 className="subheader">Think Smarter.</h2>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <div className="items-container">
                <div className="deletable-item-container">
                  <textarea
                    ref={painPointTextareaRef}
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    onInput={(e) => syncTextareaHeights(e.currentTarget)}
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
                ai.requestAssistance("problem_articulation", painPoint, { painPoint });
              }}
              isLoading={ai.loadingStage === 'problem_articulation'}
              disabled={!painPoint.trim() || !ai.canUseAI}
            />
            <Tooltip text="Attempt the prompt to proceed." isDisabled={!painPoint.trim()}>
              <button type="button" onClick={startSession} disabled={!painPoint.trim()} className="landing-button">
                Begin
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 0 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage="problem_articulation"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
        </div>

        {/* Step 1: Contributing Causes */}
        <div className={getStepClass(1)} ref={(el) => { stepRefs.current[1] = el; }}>
          <h1>Why do you think this problem is happening?</h1>
          <div className="form-content">
            <div className="input-group">
              <label className="step-description">
                <p>
                  We live in a causal universe. Every effect has a cause that precedes it. Your problem is an effect.
                  <span style={{ display: 'block', textIndent: '1em' }}>
                    List up to five causes that you think could be contributing to your problem. For each cause you identify, write down if there is a potential assumption you might be making. An assumption is something believed to be true without evidence and requires further inquiry to be considered a true cause.
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
                        <div className="cause-column">
                          <label className="item-label">Contributing Cause</label>
                          <textarea
                            ref={(el) => {
                              causeTextAreaRefs.current[index][0] = el;
                            }}
                            value={item.cause}
                            onChange={(e) => handleCauseChange(index, "cause", e.target.value)}
                            onInput={(e) =>
                              syncTextareaHeights(
                                e.currentTarget,
                                causeTextAreaRefs.current[index][1] ?? undefined,
                                index
                              )
                           }
                           className="auto-resizing-textarea"
                           disabled={step !== 1}
                         />
                       </div>
                       <div className="assumption-column">
                         <label className="item-label">Potential Assumption</label>
                         <textarea
                           ref={(el) => {
                             causeTextAreaRefs.current[index][1] = el;
                           }}
                           value={item.assumption}
                           onChange={(e) => handleCauseChange(index, "assumption", e.target.value)}
                           onInput={(e) =>
                             syncTextareaHeights(
                               e.currentTarget,
                               causeTextAreaRefs.current[index][0] ?? undefined,
                               index
                             )
                           }
                           className="auto-resizing-textarea"
                           disabled={step !== 1}
                         />
                        </div>
                      </div>
                      {index > 0 && (
                        <button type="button" className="delete-item-button" onClick={() => removeCause(index)} disabled={step !== 1}>
                          &times;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="cause-assumption-pair mt-2">
                <div className="cause-column">
                  <AIAssistButton
                    stage="root_cause"
                    isLoading={ai.loadingStage === 'root_cause'}
                    onRequest={() => ai.requestAssistance("root_cause", causes.map(c => c.cause).join(', '), { causes })}
                    disabled={step !== 1 || causes.filter(c => c.cause.trim()).length < 1 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ causes }}
                  />
                </div>
                <div className="assumption-column">
                  <AIAssistButton
                    stage="identify_assumptions"
                    isLoading={ai.loadingStage === 'identify_assumptions'}
                    onRequest={() => ai.requestAssistance("identify_assumptions", causes.map(c => c.assumption).join(', '), { causes })}
                    disabled={step !== 1 || causes.filter(c => c.assumption && c.assumption.trim()).length < 1 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ causes }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 1}>
              Back
            </button>
            {causes.length < 5 && (
              <button type="button" onClick={() => addCause()} disabled={step !== 1 || (causes.length > 0 && causes[causes.length - 1].cause.trim() === "")}>
                Add another cause
              </button>
            )}
            <Tooltip text="Attempt the prompt to proceed." isDisabled={step !== 1 || (causes.length > 0 && causes[0].cause.trim() === "")}>
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
              <p className="step-description">If I wanted to make sure this problem continued, I would...</p>
              <div className="form-content">
                <div className="input-group">
                  <div className="items-container">
                    {perpetuations.map((perpetuation) => (
                      <div key={perpetuation.id} className="deletable-item-container">
                        <textarea
                          value={perpetuation.text}
                          onChange={(e) => handlePerpetuationChange(perpetuation.id, e.target.value)}
                          onInput={(e) => syncTextareaHeights(e.currentTarget)}
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
                <div className="ai-button-container">
                  <AIAssistButton
                    stage="perpetuation"
                    isLoading={ai.loadingStage === 'perpetuation'}
                    onRequest={() => ai.requestAssistance("perpetuation", perpetuations.map(p => p.text).join(', '), { perpetuations })}
                    disabled={step !== 2 || perpetuations.filter(p => p.text.trim()).length === 0 || !ai.canUseAI}
                    sessionId={sessionId}
                    context={{ perpetuations }}
                  />
                </div>
              </div>
              <div className="button-container">
                <button type="button" onClick={prevStep} disabled={step !== 2}>
                  Back
                </button>
                {perpetuations.length < 5 && (
                  <button type="button" onClick={addPerpetuation} disabled={step !== 2 || (perpetuations.length > 0 && perpetuations[perpetuations.length - 1].text.trim() === "")}>
                    Add another action
                  </button>
                )}
                <Tooltip text="Attempt the prompt to proceed." isDisabled={step !== 2 || (perpetuations.length > 0 && perpetuations[0].text.trim() === "")}>
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
              <p className="step-description">Our problems rarely exist completely outside of ourselves. We often have a role to play. Try your best to be honest about yours. Click every action that you think might already be contributing to your problem.</p>
              <div className="form-content">
                <div className="items-container">
                  {perpetuations.map((perpetuation) => (
                    <div
                      key={perpetuation.id}
                      className={`selectable-box ${selectedPerpetuations.includes(String(perpetuation.id)) ? "selected" : ""}`}
                      onClick={() => handlePerpetuationSelection(perpetuation.id)}
                    >
                      <span className="selection-indicator">{selectedPerpetuations.includes(String(perpetuation.id)) && "✔"}</span>
                      {perpetuation.text}
                    </div>
                  ))}
                  <div
                    className={`selectable-box ${selectedPerpetuations.includes("none") ? "selected-none" : ""}`}
                    onClick={() => handlePerpetuationSelection("none")}
                  >
                    <span className="selection-indicator">{selectedPerpetuations.includes("none") && "✖"}</span>
                    None of the above
                  </div>
                </div>
              </div>
              <div className="button-container">
                <button type="button" onClick={() => setStep2Phase("input")} disabled={step !== 2}>
                  Back
                </button>
                <Tooltip text="Attempt the prompt to proceed." isDisabled={selectedPerpetuations.length === 0}>
                  <button type="button" onClick={nextStep} disabled={selectedPerpetuations.length === 0}>
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
          <div className="form-content">
            <div className="input-group">
              <label className="step-description">
                For each contributing cause you identified, outline a potential action you can take to begin addressing it.
              </label>
              <div className="items-container">
                {actionableItems.filter(item => item.id.startsWith('cause')).map((item) => {
                  const index = parseInt(item.id.split('-')[1], 10);
                  return (
                    <div key={item.id} className="actionable-item-container">
                      <div
                        className={`deletable-item-container selectable-item ${solutions[item.id] !== undefined ? "selected" : ""}`}
                        onClick={() => handleSolutionSelection(item.id)}
                      >
                        <div className="cause-assumption-pair">
                          <div className="cause-column">
                            <label className="item-label">Contributing Cause</label>
                            <textarea
                              value={item.cause}
                              readOnly={true}
                              className="auto-resizing-textarea read-only-textarea"
                              style={{ height: causeTextareaHeights[index] ? `${causeTextareaHeights[index]}px` : 'auto' }}
                              rows={1}
                            />
                          </div>
                          <div className="assumption-column">
                            <label className="item-label">Potential Assumption</label>
                            <textarea
                              value={item.assumption || ""}
                              readOnly={true}
                              className="auto-resizing-textarea read-only-textarea"
                              style={{ height: causeTextareaHeights[index] ? `${causeTextareaHeights[index]}px` : 'auto' }}
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                      {solutions[item.id] !== undefined && (
                        <div className="action-textarea-container">
                          <textarea
                            value={solutions[item.id]}
                            onChange={(e) => handleSolutionActionChange(item.id, e.target.value)}
                            onInput={(e) => syncTextareaHeights(e.currentTarget)}
                            className="auto-resizing-textarea"
                            placeholder="Enter your action here"
                            disabled={step !== 3}
                          />
                          <button type="button" className="delete-item-button" onClick={() => removeSolutionAction(item.id)} disabled={step !== 3}>
                            &times;
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {actionableItems.filter(item => item.id.startsWith('perp-')).length > 0 && (
                  <div className="mt-4">
                    <label className="item-label">My Contributions</label>
                    {actionableItems.filter(item => item.id.startsWith('perp-')).map((item) => (
                      <div key={item.id} className="actionable-item-container">
                        <div
                          className={`deletable-item-container selectable-item ${solutions[item.id] !== undefined ? "selected" : ""}`}
                          onClick={() => handleSolutionSelection(item.id)}
                        >
                          <textarea
                            value={item.cause}
                            readOnly={true}
                            className="auto-resizing-textarea read-only-textarea"
                            onInput={(e) => syncTextareaHeights(e.currentTarget)}
                            rows={1}
                          />
                        </div>
                        {solutions[item.id] !== undefined && (
                          <div className="action-textarea-container">
                            <textarea
                              value={solutions[item.id]}
                              onChange={(e) => handleSolutionActionChange(item.id, e.target.value)}
                              onInput={(e) => syncTextareaHeights(e.currentTarget)}
                              className="auto-resizing-textarea"
                              placeholder="Enter your action here"
                              disabled={step !== 3}
                            />
                            <button type="button" className="delete-item-button" onClick={() => removeSolutionAction(item.id)} disabled={step !== 3}>
                              &times;
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ai-button-container">
            <AIAssistButton
              stage="suggest_causes"
              isLoading={ai.loadingStage === 'suggest_causes'}
              onRequest={() => ai.requestAssistance("suggest_causes", "", { painPoint, causes })}
              disabled={step !== 3 || !ai.canUseAI}
              sessionId={sessionId}
              context={{ painPoint, causes }}
            />
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 3}>
              Back
            </button>
            <Tooltip text="Attempt the prompt to proceed." isDisabled={Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== "")}>
              <button type="button" onClick={nextStep} disabled={Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== "")}>
                Next
              </button>
            </Tooltip>
          </div>
          {ai.error && <AIErrorCard error={ai.error} onDismiss={ai.dismissResponse} />}
          {ai.currentResponse && step === 3 && (
            <AIResponseCard
              response={ai.currentResponse}
              stage="suggest_causes"
              onDismiss={ai.dismissResponse}
              onFeedback={ai.provideFeedback}
              canFollowUp={ai.canUseAI}
            />
          )}
          {suggestedCauses.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900">Suggested Causes to Consider:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedCauses.map((cause, index) => (
                  <SuggestedCause
                    key={index}
                    text={cause}
                    onAdd={() => {
                      addCause(cause);
                      setSuggestedCauses(prev => prev.filter(c => c !== cause));
                    }}
                    onDismiss={() => setSuggestedCauses(prev => prev.filter(c => c !== cause))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Fears */}
        <div className={getStepClass(4)} ref={(el) => { stepRefs.current[4] = el; }}>
          <h1>Name your fear</h1>
          <p className="step-description">Select each action that you're worried about taking.</p>
          <div className="form-content">
            <div className="items-container">
              {Object.entries(solutions).map(([id, action]) => (
                <div key={id} className="actionable-item-container">
                  <div
                    className={`selectable-box ${fears[id] !== undefined ? "selected" : ""}`}
                    onClick={() => handleFearSelection(id)}
                  >
                    <div className="item-text">{action}</div>
                  </div>
                  {fears[id] !== undefined && (
                    <div className="fear-analysis-container">
                      <button type="button" className="delete-item-button" onClick={() => removeFearAction(id)} disabled={step !== 4}>
                        &times;
                      </button>
                      <div>
                        <label className="input-label">If you take this action, what could go wrong?</label>
                        <textarea
                          value={fears[id].name}
                          onChange={(e) => handleFearChange(id, "name", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">What action could you take to try and prevent that from happening?</label>
                        <textarea
                          value={fears[id].mitigation}
                          onChange={(e) => handleFearChange(id, "mitigation", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">If your fear comes true, what would you do to move forward?</label>
                        <textarea
                          value={fears[id].contingency}
                          onChange={(e) => handleFearChange(id, "contingency", e.target.value)}
                          onInput={(e) => syncTextareaHeights(e.currentTarget)}
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
          </div>
          <div className="ai-button-container">
            <AIAssistButton
              stage="action_planning"
              isLoading={ai.loadingStage === 'action_planning'}
              onRequest={() => ai.requestAssistance("action_planning", Object.values(solutions).join(', '), { solutions, fears })}
              disabled={step !== 4 || (Object.keys(fears).length === 0 && !notWorried) || !ai.canUseAI}
              sessionId={sessionId}
              context={{ solutions, fears }}
            />
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 4}>
              Back
            </button>
            <Tooltip text="Attempt the prompt to proceed." isDisabled={!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== "")}>
              <button
                type="button"
                onClick={nextStep}
                disabled={!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== "")}
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
          <div className="form-content">
            <div className="input-group">
              <label className="step-description mb-4">The most important step is always the next one. What's yours?</label>
              <div className="items-container">
                {Object.entries(solutions).map(([id, action]) => (
                  <div key={id} className="actionable-item-container">
                    <div
                      className={`selectable-box ${actionPlan.selectedActionId === id ? "selected" : ""}`}
                      onClick={() => handleActionSelection(id)}
                    >
                      {action}
                    </div>
                    {actionPlan.selectedActionId === id && (
                      <textarea
                        value={actionPlan.elaborationTexts[id] || ""}
                        onChange={(e) => handleElaborationChange(id, e.target.value)}
                        onInput={(e) => syncTextareaHeights(e.currentTarget)}
                        className="auto-resizing-textarea"
                        placeholder="Optional: Elaborate on the exact steps you intend to take here..."
                        disabled={step !== 5}
                      />
                    )}
                  </div>
                ))}
                <textarea
                  value={actionPlan.otherActionText}
                  onChange={(e) => handleOtherActionChange(e.target.value)}
                  onInput={(e) => syncTextareaHeights(e.currentTarget)}
                  className="auto-resizing-textarea"
                  placeholder="Something else..."
                  disabled={step !== 5}
                />
              </div>
            </div>
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 5}>
              Back
            </button>
            <button type="button" onClick={handleSubmit} disabled={!actionPlan.selectedActionId}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}