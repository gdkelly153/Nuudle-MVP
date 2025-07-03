### Revised Plan: AI Prompt Formatting Enhancement

The goal is to modify the prompts in `api/services/aiService.js` to ensure all AI-generated responses use a bulleted format for readability, while preserving the existing two-section structure and the depth of the AI's questions.

---

#### 1. `root_cause` Prompt Update

*   **Objective:** Ensure the AI's reflection on each cause and its suggestions for hidden factors are presented as bullet points.
*   **Proposed New Prompt:**
    ```javascript
    root_cause: "The user has identified the following potential causes for their problem: '{{userInput}}'. Your response must have two distinct sections, and all questions or points in both sections must be formatted as bullet points.\n\n## Reflecting on Your Causes\nFor each cause the user provided, create a corresponding bullet point with a question that asks them to elaborate on why they believe it's a primary cause. Ask about evidence, experiences, or patterns related to that specific cause.\n\n## Discovering Hidden Factors\nIn this section, help them explore potential causes they might have overlooked by asking questions as bullet points. Consider asking about: systemic or structural factors, underlying assumptions, historical patterns, or external pressures. Frame these as possibilities to explore."
    ```

#### 2. `identify_assumptions` Prompt Update

*   **Objective:** Format the "Examining Your Evidence" and "Uncovering Hidden Assumptions" sections as bulleted lists.
*   **Proposed New Prompt:**
    ```javascript
    identify_assumptions: "The user is working on this problem: '{{painPoint}}' and has identified these causes: '{{causes}}'. Your response must have two distinct sections, and all questions or points in both sections must be formatted as bullet points.\n\n## Examining Your Evidence\nFor each cause the user provided, create a corresponding bullet point with a question asking them to reflect on the evidence they have for it. Ask what makes them confident and if there are any gaps in their knowledge.\n\n## Uncovering Hidden Assumptions\nIn this section, help them identify potential unstated assumptions by asking thoughtful questions as bullet points. Consider assumptions about other people's motivations, how systems work, or cause-and-effect relationships."
    ```

#### 3. `potential_actions` Prompt Update

*   **Objective:** Format the reflection on drafted actions and the exploration of new possibilities as bulleted lists.
*   **Proposed New Prompt:**
    ```javascript
    potential_actions: "The user is working on this problem: '{{painPoint}}', with causes '{{causes}}' and perpetuations '{{perpetuations}}'. They have drafted potential actions: '{{userInput}}'. Your response must have two distinct sections, and all questions or points in both sections must be formatted as bullet points.\n\n## Reflecting on Your Actions\nFor each action the user drafted, create a corresponding bullet point with a thoughtful, open-ended question. Focus on effectiveness, feasibility, potential obstacles, or underlying assumptions.\n\n## Exploring Other Possibilities\nIn this section, help them discover other potential actions by asking questions as bullet points. Ask about different approaches, addressing root causes, collaboration, or preventive measures. Do not give direct advice."
    ```

#### 4. `perpetuation` Prompt Update

*   **Objective:** Present the questions about the user's role and the "thought experiment" as bullet points.
*   **Proposed New Prompt:**
    ```javascript
    perpetuation: "The user is exploring their potential role in perpetuating a problem ('{{painPoint}}') with these behaviors: '{{userInput}}'. Your response must have two distinct sections, and all questions or points in both sections must be formatted as bullet points.\n\n## Understanding Your Role\nFor each behavior the user listed, create a corresponding bullet point with a question that helps them reflect on any subtle benefits or comforts they might be deriving from it. Ask what they might be gaining, even unconsciously.\n\n## Discovering Contributing Patterns\nIn this section, use a thought experiment to identify contributing patterns. As a bullet point, ask them: 'If you wanted to guarantee this problem of {{painPoint}} continues or gets worse, what would be on your secret to-do list?' Then, add another bullet point asking them to brainstorm actions, behaviors, or mindsets that would ensure the problem persists."