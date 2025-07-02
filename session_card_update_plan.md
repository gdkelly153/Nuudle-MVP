### Session Card Update Plan

This plan outlines the steps to modify the session cards on the Session History page as per your request. The goal is to simplify the card's content and adjust the header layout for a more compact and relevant presentation.

#### 1. Modify Session Card Content

I will update the `frontend/src/components/SessionCard.tsx` component to alter the information displayed in the card's body.

*   **Remove "Causes" Section:** The section displaying the "Causes" of the problem will be removed entirely to simplify the card's content.
*   **Update "Action Plan" Text:** The "Action Plan" text will be updated to display the `primary_action` from the session's AI summary. This will make the card's content consistent with the AI summary page. If an AI summary is not available, it will fall back to the default `action_plan`.

#### 2. Adjust Session Card Header Layout

I will modify the header of the session card to display the title and date on the same horizontal line. This will reduce the vertical space occupied by the header.

*   **Apply Flexbox Styling:** I will apply flexbox styling to the header element in `frontend/src/components/SessionCard.tsx` to align the title and date horizontally.

#### Implementation Strategy

Here is a Mermaid diagram illustrating the planned workflow:

```mermaid
graph TD
    A[Start] --> B{Analyze Request};
    B --> C{Identify Files to Modify};
    C --> D[Plan Content Changes in SessionCard.tsx];
    C --> E[Plan Header Layout Changes in SessionCard.tsx];
    D --> F{Remove 'Causes' section};
    D --> G{Update 'Action Plan' text};
    E --> H{Apply Flexbox to Header};
    F --> I[Modify JSX in SessionCard.tsx];
    G --> I;
    H --> J[Modify styling for session-card-header];
    I --> K{Review and Finalize Changes};
    J --> K;
    K --> L[Switch to 'code' mode for implementation];
    L --> M[End];