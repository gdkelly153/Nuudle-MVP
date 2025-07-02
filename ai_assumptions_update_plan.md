# Revised Plan to Enhance AI Assumption Discovery

1.  **Objective:** The goal is to enhance the "Help me identify assumptions" AI prompt. The `discovery` section should be updated to provide a *mix* of both context-specific assumptions (derived from the user's problem and causes) and the broader, more universal assumptions it currently generates.

2.  **Analysis:**
    *   Your feedback clarifies that the AI should not simply replace the general discovery questions with context-specific ones, but rather *combine* them.
    *   The AI must use the user's `painPoint` and `causes` for analysis without repeating them or showing the `{{placeholder}}` syntax in the final output. This is already a core instruction in the system prompt, which I will ensure is respected.

3.  **Proposed Solution (Revised):** I will update the `discovery` prompt for the `identify_assumptions` stage in `api/services/aiService.js`. The new instructions will explicitly direct the AI to generate a blended list of assumptions—some tailored to the user's specific situation and some that are more general.

    Here’s the updated diagram reflecting the new logic:

    ```mermaid
    graph TD
        subgraph "Revised Proposed AI Logic"
            A[User provides assumptions] --> B{AI analyzes those assumptions};
            B --> C{AI analyzes user's problem & causes for context};
            C --> D{AI generates a blended list of assumptions};
            D -- "1-2 Specific Assumptions" --> E[Context-aware suggestions];
            D -- "1-2 Broad Assumptions" --> F[General, common suggestions];
            E & F --> G[Present combined list to user];
        end
    ```

4.  **Implementation Details (Revised):**

    I will modify the `discovery` section of the `identify_assumptions` prompt in `api/services/aiService.js`.

    *   **Current `discovery` prompt:**
        > "Beyond examining what you've already identified, it's valuable to consider what other assumptions might be lurking beneath the surface of your thinking. These hidden assumptions can significantly impact how you approach your problem and the solutions you consider. Ask 2-3 action-oriented validation questions in bullet points that help them uncover additional assumptions they might be making."

    *   **Proposed Revised `discovery` prompt:**
        > "Let's broaden our search for hidden beliefs. First, considering your problem ('{{painPoint}}') and its causes ('{{causes}}'), identify 1-2 potential assumptions that seem directly related to your situation. Then, suggest 1-2 broader, more universal assumptions that often come up in similar contexts. For each assumption, pose a question to help you validate it. Present these as a single bulleted list."

    This new prompt instructs the AI to perform a more nuanced task:
    *   It uses the `painPoint` and `causes` as analytical inputs.
    *   It generates a mix of specific and broad assumptions.
    *   It combines them into a single, seamless list for the user.
    *   It continues to ask validation questions for each point.

    I will also update the header to better reflect this combined approach.

    *   **Current `discovery` header:** `### What Else Might You Be Assuming?`
    *   **Proposed `discovery` header:** `### Uncovering Broader Assumptions`

This revised plan ensures the AI's response is more relevant and powerful by integrating specific user context while retaining the value of exploring common, often-overlooked beliefs.