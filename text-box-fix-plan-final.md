# Text Box Sizing Fix Plan (Final)

## Problem

The text box auto-sizing issue persists, causing both shrinking and text overflow. The root cause is a conflict between the AI button and text box styling.

## Root Cause Analysis

The `AIAssistButton` component in `frontend/src/components/AIComponents.tsx` is wrapped in a `div` with the style `display: inline-block`. This is causing the button to shrink to fit its content, which is the desired behavior for the button. However, this is also affecting the layout of the parent container, which is causing the text boxes to shrink as well.

## The Final Plan

To permanently fix this issue, I will implement the following changes:

1.  **Remove the `display: inline-block` style from the `AIAssistButton` component's wrapper `div` in `frontend/src/components/AIComponents.tsx`**: This will prevent the button from affecting the layout of its parent container.

2.  **Add a new CSS class to the `AIAssistButton` component's wrapper `div`**: I will add a new class named `ai-button-wrapper` to the `div`.

3.  **Add styles for the `ai-button-wrapper` class in `frontend/src/app/globals.css`**: I will add a new style rule for the `ai-button-wrapper` class that sets `display: inline-block`. This will ensure that the button continues to shrink to fit its content, but it will no longer affect the layout of the text boxes.

4.  **Revert the previous CSS changes**: I will revert the changes I made to the `.cause-column`, `.assumption-column`, and `.auto-resizing-textarea` classes in `frontend/src/app/globals.css`. These changes are no longer necessary and may cause other layout issues.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Identify Conflicting `inline-block` Style};
    B --> C{Remove Inline Style from `AIAssistButton`};
    C --> D{Add `ai-button-wrapper` Class};
    D --> E{Add `display: inline-block` to `ai-button-wrapper` in CSS};
    E --> F{Revert Previous CSS Changes};
    F --> G[End];