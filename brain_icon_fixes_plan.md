# Final Plan: Standardize Brain Icon Positioning

The goal is to apply the exact positioning and size of the `HelpMeNuudleButton`'s brain icon to all other brain icons in the application.

### 1. Source of Truth
The CSS class `.brain-icon` from `frontend/src/app/globals.css` and the classes `w-5 h-5 text-blue-600` from the `HelpMeNuudleButton` in `frontend/src/components/AIComponents.tsx` define the desired appearance.

### 2. Target for Update
The `AIAssistButton` component in `frontend/src/components/AIComponents.tsx` contains the icons that need to be updated.

### 3. Proposed Change
I will modify the `Brain` component inside the `AIAssistButton`. Specifically, I will replace the existing inline Tailwind CSS classes with the standardized classes from the `HelpMeNuudleButton`.

*   **From:** `<Brain className="absolute -top-1 -left-1 w-3 h-3 text-blue-600 z-10" />`
*   **To:** `<Brain className="brain-icon w-5 h-5 text-blue-600" />`

This change will ensure all brain icons are visually consistent.

### Diagram

```mermaid
graph TD
    A[Start] --> B{Use 'Help Me Nuudle' Icon as Standard};
    B --> C[Locate 'AIAssistButton' Icons];
    C --> D[Apply '.brain-icon w-5 h-5' classes];
    D --> E{Review Final Plan};
    E --> F[Implement in Code Mode];
    F --> G[End];