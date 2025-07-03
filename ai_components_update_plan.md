# Plan to Update `HelpMeNuudleButton`

The goal is to modify the `frontend/src/components/AIComponents.tsx` file to replace the existing `HelpMeNuudleButton` with a corrected version. This will involve updating the props and the component's rendering logic to handle the loading state.

## 1. Update the Prop Interface

The `HelpMeNuudleButtonProps` interface will be modified:
- The `onActivate` prop will be renamed to `onClick`.
- A new boolean prop, `isLoading`, will be added.

## 2. Update the Component Implementation

The body of the `HelpMeNuudleButton` component will be replaced. The new implementation will:
- Destructure `onClick`, `disabled`, and `isLoading` from the props.
- Use the `onClick` prop for the button's click handler.
- Disable the button when either `disabled` or `isLoading` is `true`.
- Conditionally render a loading indicator (`Loader2` icon and text) when `isLoading` is `true`, and the "Help me Nuudle" text otherwise.

## Component Logic Diagram

```mermaid
graph TD
    subgraph HelpMeNuudleButton
        direction LR
        A[Props: onClick, disabled, isLoading] --> B{isLoading?};
        B -- true --> C[Render Loading State];
        B -- false --> D[Render Default State];
        C --> E[<button disabled> <Loader2 /> AI is thinking... </button>];
        D --> F[<button disabled={disabled}> Help me Nuudle </button>];
    end