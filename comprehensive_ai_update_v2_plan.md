### **Final Plan: Comprehensive & Integrated AI Prompt Refinement**

**Objective:** Revise all AI prompting logic in `api/services/aiService.js` to be more direct, specific, and actionable. The AI will provide concrete examples, suggest methods for validating assumptions, and ensure that action plans are built on a solid foundation of validated beliefs, all while maintaining a personalized, conversational tone.

**File to be Modified:** `api/services/aiService.js`

**1. Comprehensive & Integrated Prompt Overhaul:**

I will revise the `body` of every prompt configuration in the `prompts` object (lines 120-245) with the following enhancements:

*   **`root_cause`:**
    *   **Analysis:** The AI will explain *why* a stated cause might be a symptom and provide examples of deeper root causes.
    *   **Discovery:** The AI will ask targeted, conversational questions to explore underlying needs, beliefs, and environmental factors without using rigid, formal language.

*   **`identify_assumptions` & `identify_assumptions_discovery`:**
    *   **Suggestion:** The AI will proactively suggest potential unstated assumptions based on your inputs.
    *   **Validation Guidance (New):** For each assumption identified (whether by you or the AI), the prompt will instruct the AI to suggest 1-2 specific, actionable ways you could test or validate that assumption. For example, "To check if this belief is true, you could try [a small, low-risk experiment] or [have a specific conversation with someone]."

*   **`potential_actions`:**
    *   **Analysis:** The AI will provide targeted feedback on your drafted actions.
    *   **Discovery & Integration (New):** The AI will now cross-reference your proposed actions with your identified assumptions. If an action plan rests on a critical, unvalidated assumption, the AI will be prompted to point this out and suggest adding a validation step. For example: "Your plan to [action] seems to depend heavily on the assumption that [X]. Before moving forward, it might be wise to add an action to confirm this. Perhaps you could [specific validation action]?"

*   **`perpetuation`, `action_planning`, and `session_summary`:**
    *   These will be updated in line with the overall goal of providing more direct, specific, and actionable feedback with concrete examples.

**2. Final Plan Diagram:**

```mermaid
graph TD
    A[Start: User Request] --> B{Analyze `aiService.js`};
    B --> C{Identify All Prompts for Revision};

    C --> D{Revise `identify_assumptions` Prompts};
    D --> D1[Suggest Unstated Assumptions];
    D --> D2[Provide Actionable Validation Methods];

    C --> E{Revise `potential_actions` Prompt};
    E --> E1[Suggest Creative Actions];
    E --> E2[Cross-Reference Actions with Assumptions];
    E2 --> E3[Suggest Adding Validation Actions to Plan];

    C --> F{Revise `root_cause` & Other Prompts};
    F --> F1[Provide Specific Examples & Direct Guidance];

    D2 & E3 & F1 --> G{New Prompts: Integrated, actionable, and conversational};
    G --> H{Apply changes to `api/services/aiService.js`};
    H --> I[End: AI provides deeply integrated and helpful guidance];