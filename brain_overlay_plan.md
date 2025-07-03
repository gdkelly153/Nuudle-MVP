# Plan to Overlay Brain Icon

The goal is to reposition the brain icon so it overlaps with the top-left corner of the AI buttons. This will be achieved by modifying `frontend/src/components/AIComponents.tsx`.

## 1. `HelpMeNuudleButton` Modification:

*   Remove the wrapping `div` element.
*   Move the `relative` and `inline-block` classes to the `<button>` element.
*   Move the `Brain` icon inside the `<button>` element to position it relative to the button.

## 2. `AIAssistButton` Modification:

*   Apply the same changes as the `HelpMeNuudleButton`.
*   Remove the wrapping `div`.
*   Add the `relative` class to the `<button>` element.
*   Move the `Brain` icon inside the `<button>` element.

This will ensure the brain icon is positioned in the top-left corner of each button, creating the desired overlap effect.

## Diagram

```mermaid
graph TD
    subgraph Before
        A[Tooltip] --> B("div (relative, inline-block)")
        B --> C("Brain (absolute)")
        B --> D("button")
    end

    subgraph After
        E[Tooltip] --> F("button (relative, inline-block)")
        F --> G("Brain (absolute)")
    end