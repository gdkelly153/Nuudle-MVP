### Plan to Implement Tooltips on Disabled Buttons

1.  **Create a Reusable Tooltip Component:**
    *   I'll start by creating a new, reusable React component named `Tooltip` within a new file located at `frontend/src/components/Tooltip.tsx`.
    *   This component will be designed to wrap any child element and will accept a `text` prop for the tooltip's content.
    *   The tooltip will be engineered to appear only when the wrapped child element is in a `disabled` state.

2.  **Integrate Tooltip with "Begin" and "Next" Buttons:**
    *   In `frontend/src/app/SessionWizard.tsx`, I will import and wrap the "Begin" and "Next" buttons with our new `Tooltip` component.
    *   The `text` prop will be set to: "To proceed, please attempt the prompt first."

3.  **Integrate Tooltip with AI Buttons:**
    *   Similarly, in `frontend/src/components/AIComponents.tsx`, I will wrap the `HelpMeNuudleButton` and `AIAssistButton` components with the `Tooltip`.
    *   For these AI-related buttons, the `text` prop will be: "This feature needs an input to function correctly. Please attempt the prompt before utilizing."

4.  **Style the Tooltip:**
    *   Finally, I will add the necessary CSS styles for the tooltip to `frontend/src/app/globals.css`. This will ensure the tooltip is well-positioned, visually consistent with the site's theme, and includes a subtle fade-in animation for a better user experience.

Here is a Mermaid diagram illustrating the plan:

```mermaid
graph TD
    A[Start] --> B(Create Reusable Tooltip Component);
    B --> C(Integrate with "Begin"/"Next" Buttons);
    C --> D(Set Tooltip Text for "Begin"/"Next");
    B --> E(Integrate with AI Buttons);
    E --> F(Set Tooltip Text for AI Buttons);
    D & F --> G(Add CSS Styling for Tooltip);
    G --> H[Finish];