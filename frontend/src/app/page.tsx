"use client";

import React, { useState, useEffect, useRef } from "react";

interface ActionableItem {
  id: string;
  cause: string;
  assumption?: string;
}

export default function Home() {
  const [painPoint, setPainPoint] = useState("");
  const [step, setStep] = useState(0);
  const [causes, setCauses] = useState([{ cause: "", assumption: "" }]);
  const [solutions, setSolutions] = useState<{ [id: string]: string }>({});
  const [actionableItems, setActionableItems] = useState<ActionableItem[]>([]);
  const [perpetuations, setPerpetuations] = useState<{ id: number; text: string }[]>([{ id: 1, text: "" }]);
  const [step2Phase, setStep2Phase] = useState<"input" | "selection">("input");
  const [selectedPerpetuations, setSelectedPerpetuations] = useState<string[]>([]);
  const [fears, setFears] = useState<{ [id: string]: { name: string; mitigation: string; contingency: string } }>({});
  const [actionPlan, setActionPlan] = useState<{
    selectedActionId: string | null;
    otherActionText: string;
    elaborationTexts: { [actionId: string]: string };
  }>({
    selectedActionId: null,
    otherActionText: "",
    elaborationTexts: {},
  });

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const painPointTextareaRef = useRef<HTMLTextAreaElement>(null);

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
          autoResizeTextarea(painPointTextareaRef.current);
        }
      }, 0);
    }
  }, [step]);

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

  const addCause = () => {
    if (causes.length < 5) {
      setCauses([...causes, { cause: "", assumption: "" }]);
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
    const contributingCauses = selectedPerpetuations.includes("none")
      ? ["none"]
      : perpetuations
          .filter((p) => selectedPerpetuations.includes(String(p.id)))
          .map((p) => p.text);

    const finalSolutions = Object.entries(solutions).map(([id, action]) => {
      const item = actionableItems.find(item => item.id === id);
      return {
        item: item ? item.cause : 'Unknown',
        action: action
      };
    });

    const sessionData = {
      pain_point: painPoint,
      causes: causes.filter(
        (c) => c.cause.trim() !== "" || c.assumption.trim() !== ""
      ),
      perpetuations: perpetuations
        .map((p) => p.text)
        .filter((perpetuation) => perpetuation.trim() !== ""),
      solutions: finalSolutions,
      fears: Object.values(fears),
      action_plan: actionPlan.selectedActionId === 'other'
        ? actionPlan.otherActionText
        : actionPlan.selectedActionId
        ? `${Object.entries(solutions).find(([id]) => id === actionPlan.selectedActionId)?.[1] || ''}: ${actionPlan.elaborationTexts[actionPlan.selectedActionId] || ''}`
        : '',
      contributing_causes: contributingCauses,
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

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
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
        <div
          className={getStepClass(0)}
          ref={(el) => {
            stepRefs.current[0] = el;
          }}
        >
          <h1>Nuudle</h1>
          <h2 className="subheader">Question. Understand. Know.</h2>
          <div className="form-content initial-form-content">
            <div className="input-group">
              <div className="items-container">
                <div className="deletable-item-container">
                  <textarea
                    ref={painPointTextareaRef}
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    className="auto-resizing-textarea"
                    placeholder="What problem are you trying to solve?"
                    disabled={step !== 0}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-container">
            <button
              type="button"
              onClick={startSession}
              disabled={!painPoint.trim()}
            >
              Onward!
            </button>
          </div>
        </div>
        <div
          className={getStepClass(1)}
          ref={(el) => {
            stepRefs.current[1] = el;
          }}
        >
          <h1>Why do you think this problem is happening?</h1>
          <div className="form-content">
            <div className="input-group">
              <label className="input-label">
                We live in a causal universe. Meaning every effect has a cause
                that precedes it. Your problem is the effect, list up to five
                causal factors that you think could be contributing to it. For
                each causal factor, consider if it is verifiably true or if it
                is an assumption you might be making. If you think it may be an
                assumption, describe it. An assumption is something believed to
                be true without evidence.
              </label>
              <div
                className="causes-container"
              >
                {causes.map((item, index) => (
                  <div key={index} className="deletable-item-container">
                    <div className="cause-assumption-pair">
                      <div className="cause-column">
                        <label className="item-label">Causal Factor</label>
                        <textarea
                          value={item.cause}
                          onChange={(e) =>
                            handleCauseChange(index, "cause", e.target.value)
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 1}
                        />
                      </div>
                      <div className="assumption-column">
                        <label className="item-label">Assumption</label>
                        <textarea
                          value={item.assumption}
                          onChange={(e) =>
                            handleCauseChange(
                              index,
                              "assumption",
                              e.target.value
                            )
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 1}
                        />
                      </div>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        className="delete-item-button"
                        onClick={() => removeCause(index)}
                        disabled={step !== 1}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 1}>
              Back
            </button>
            {causes.length < 5 && (
              <button
                type="button"
                onClick={addCause}
                disabled={
                  step !== 1 ||
                  (causes.length > 0 &&
                    causes[causes.length - 1].cause.trim() === "")
                }
              >
                Add another cause
              </button>
            )}
            <button
              type="button"
              onClick={() => cleanupAndProceed(causes, setCauses, nextStep)}
              disabled={
                step !== 1 ||
                (causes.length > 0 && causes[0].cause.trim() === "")
              }
            >
              Next
            </button>
          </div>
        </div>
        <div
          className={getStepClass(2)}
          ref={(el) => {
            stepRefs.current[2] = el;
          }}
        >
          {step2Phase === "input" ? (
            <>
              <h1>
                If you were to perpetuate the problem, what actions could you
                take?
              </h1>
              <p className="step-description">
                If I wanted to make sure this problem continued, I would...
              </p>
              <div className="form-content">
                <div className="input-group">
                  <div className="items-container">
                    {perpetuations.map((perpetuation) => (
                      <div key={perpetuation.id} className="deletable-item-container">
                        <textarea
                          value={perpetuation.text}
                          onChange={(e) =>
                            handlePerpetuationChange(
                              perpetuation.id,
                              e.target.value
                            )
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 2}
                        />
                        {perpetuations.length > 1 && (
                          <button
                            type="button"
                            className="delete-item-button"
                            onClick={() => removePerpetuation(perpetuation.id)}
                            disabled={step !== 2}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="button-container">
                <button type="button" onClick={prevStep} disabled={step !== 2}>
                  Back
                </button>
                {perpetuations.length < 5 && (
                  <button
                    type="button"
                    onClick={addPerpetuation}
                    disabled={
                      step !== 2 ||
                      (perpetuations.length > 0 &&
                        perpetuations[perpetuations.length - 1].text.trim() === "")
                    }
                  >
                    Add another action
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const cleanedItems = perpetuations.filter(
                      (p) => p.text.trim() !== ""
                    );
                    setPerpetuations(
                      cleanedItems.length > 0 ? cleanedItems : [{ id: 1, text: "" }]
                    );
                    setStep2Phase("selection");
                  }}
                  disabled={
                    step !== 2 ||
                    (perpetuations.length > 0 &&
                      perpetuations[0].text.trim() === "")
                  }
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <h1>
                Click every action that you think might already be contributing
                to your problem.
              </h1>
              <p className="step-description">
                Our problems rarely exist completely outside of ourselves. We nearly always have a role to play. Try your best to be honest.
              </p>
              <div className="form-content">
                <div className="items-container">
                  {perpetuations.map((perpetuation) => (
                    <div
                      key={perpetuation.id}
                      className={`selectable-box ${
                        selectedPerpetuations.includes(String(perpetuation.id))
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handlePerpetuationSelection(perpetuation.id)}
                    >
                      <span className="selection-indicator">
                        {selectedPerpetuations.includes(String(perpetuation.id)) && "✔"}
                      </span>
                      {perpetuation.text}
                    </div>
                  ))}
                  <div
                    className={`selectable-box ${
                      selectedPerpetuations.includes("none")
                        ? "selected-none"
                        : ""
                    }`}
                    onClick={() => handlePerpetuationSelection("none")}
                  >
                    <span className="selection-indicator">
                      {selectedPerpetuations.includes("none") && "✖"}
                    </span>
                    None of the above
                  </div>
                </div>
              </div>
              <div className="button-container">
                <button
                  type="button"
                  onClick={() => setStep2Phase("input")}
                  disabled={step !== 2}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={selectedPerpetuations.length === 0}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
        <div
          className={getStepClass(3)}
          ref={(el) => {
            stepRefs.current[3] = el;
          }}
        >
          <h1>What can you do about it?</h1>
          <div className="form-content">
            <div className="input-group">
              <label className="input-label">
                Select the causal factors you think would be useful to address. Consider your assumptions, then outline a potential action you can take to begin addressing it.
              </label>
              <div className="items-container">
                {actionableItems.map((item) => (
                  <div key={item.id} className="actionable-item-container">
                    <div
                      className={`selectable-box ${
                        solutions[item.id] !== undefined ? "selected" : ""
                      }`}
                      onClick={() => handleSolutionSelection(item.id)}
                    >
                      {item.assumption ? (
                        <div className="cause-assumption-pair">
                          <div className="cause-column">
                            <label className="item-label">Causal Factor</label>
                            <div className="item-text">{item.cause}</div>
                          </div>
                          <div className="assumption-column">
                            <label className="item-label">Assumption</label>
                            <div className="item-text">{item.assumption}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="item-text">{item.cause}</div>
                      )}
                    </div>
                    {solutions[item.id] !== undefined && (
                      <div className="action-textarea-container">
                        <textarea
                          value={solutions[item.id]}
                          onChange={(e) =>
                            handleSolutionActionChange(item.id, e.target.value)
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          placeholder="Enter your action here"
                          disabled={step !== 3}
                        />
                        <button
                          type="button"
                          className="delete-item-button"
                          onClick={() => removeSolutionAction(item.id)}
                          disabled={step !== 3}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 3}>
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={
                Object.keys(solutions).length === 0 ||
                !Object.values(solutions).some((action) => action.trim() !== "")
              }
            >
              Next
            </button>
          </div>
        </div>
        <div
          className={getStepClass(4)}
          ref={(el) => {
            stepRefs.current[4] = el;
          }}
        >
          <h1>Name your fear</h1>
          <p className="step-description">
            Select each action that you're worried about taking.
          </p>
          <div className="form-content">
            <div className="items-container">
              {Object.entries(solutions).map(([id, action]) => (
                <div key={id} className="actionable-item-container">
                  <div
                    className={`selectable-box ${
                      fears[id] !== undefined ? "selected" : ""
                    }`}
                    onClick={() => handleFearSelection(id)}
                  >
                    <div className="item-text">{action}</div>
                  </div>
                  {fears[id] !== undefined && (
                    <div className="fear-analysis-container">
                      <button
                        type="button"
                        className="delete-item-button"
                        onClick={() => removeFearAction(id)}
                        disabled={step !== 4}
                      >
                        &times;
                      </button>
                      <div>
                        <label className="input-label">
                          If you take this action, what could go wrong?
                        </label>
                        <textarea
                          value={fears[id].name}
                          onChange={(e) =>
                            handleFearChange(id, "name", e.target.value)
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">
                          What action can you take to try and prevent that from
                          happening?
                        </label>
                        <textarea
                          value={fears[id].mitigation}
                          onChange={(e) =>
                            handleFearChange(id, "mitigation", e.target.value)
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                      <div>
                        <label className="input-label">
                          If your fear comes true, what would you do to move
                          forward?
                        </label>
                        <textarea
                          value={fears[id].contingency}
                          onChange={(e) =>
                            handleFearChange(id, "contingency", e.target.value)
                          }
                          onInput={(e) => autoResizeTextarea(e.currentTarget)}
                          className="auto-resizing-textarea"
                          disabled={step !== 4}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="button-container">
            <button type="button" onClick={prevStep} disabled={step !== 4}>
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={
                !Object.values(fears).some(
                  (fear) =>
                    fear.name.trim() !== "" &&
                    fear.mitigation.trim() !== "" &&
                    fear.contingency.trim() !== ""
                )
              }
            >
              Next
            </button>
          </div>
        </div>
        <div
          className={getStepClass(5)}
          ref={(el) => {
            stepRefs.current[5] = el;
          }}
        >
          <h1>Stop Nuudling. Start Doodling.</h1>
          <div className="form-content">
            <div className="input-group">
              <label className="input-label">
                The most important step is always the next one. What's yours?
              </label>
              <div className="items-container">
                {Object.entries(solutions).map(([id, action]) => (
                  <div key={id} className="actionable-item-container">
                    <div
                      className={`selectable-box ${
                        actionPlan.selectedActionId === id ? "selected" : ""
                      }`}
                      onClick={() => handleActionSelection(id)}
                    >
                      {action}
                    </div>
                    {actionPlan.selectedActionId === id && (
                      <textarea
                        value={actionPlan.elaborationTexts[id] || ""}
                        onChange={(e) =>
                          handleElaborationChange(id, e.target.value)
                        }
                        onInput={(e) => autoResizeTextarea(e.currentTarget)}
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
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
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
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!actionPlan.selectedActionId}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
