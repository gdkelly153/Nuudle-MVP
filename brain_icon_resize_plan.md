# Final Plan: Adjust AI Assist Icon Size

The goal is to reduce the size of the brain icons on the `AIAssistButton` components by approximately 20% using standard Tailwind classes, while leaving the `HelpMeNuudleButton` icon's size unchanged.

### 1. Reference Icon
The `HelpMeNuudleButton`'s brain icon will remain styled with `w-5 h-5`.

### 2. Target for Update
The `AIAssistButton` component's `Brain` icon in `frontend/src/components/AIComponents.tsx`.

### 3. Proposed Change
I will modify the `Brain` component inside the `AIAssistButton` to use the `w-4 h-4` classes for a smaller size.

*   **From:** `<Brain className="brain-icon w-5 h-5 text-blue-600" />`
*   **To:** `<Brain className="brain-icon w-4 h-4 text-blue-600" />`

This change will make the AI assist icons smaller than the main "Help Me Nuudle" icon, as requested.

### Diagram

```mermaid
graph TD
    A[Start] --> B{Keep 'Help Me Nuudle' Icon at w-5 h-5};
    B --> C{Update 'AIAssistButton' Icon};
    C --> D[Change size from 'w-5 h-5' to 'w-4 h-4'];
    D --> E{Review Final Plan};
    E --> F[Implement in Code Mode];
    F --> G[End];