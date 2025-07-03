# Plan to Adjust AIAssistButton Spacing

The goal is to increase the horizontal spacing within the `AIAssistButtons` to create more distance between the text and the brain icons, while ensuring the text remains centered.

## 1. Modify `frontend/src/components/AIComponents.tsx`

- Move the `BrainIconWithAnimation` component inside the `<button>` element within the `AIAssistButton` component.
- Add a `gap-2` class to the button's `className` to create space between the icon and the text.

## 2. Modify `frontend/src/app/globals.css`

- The `ai-assist-button` currently has `padding: 4px 8px;`. To give more space on the sides, I will change this to `padding: 4px 12px;`. This will increase the horizontal padding.

## Component Structure Change

This diagram illustrates the proposed component structure change:

```mermaid
graph TD
    subgraph Before
        A["div.ai-button-wrapper"] --> B["BrainIconWithAnimation"];
        A --> C["button.ai-assist-button"];
        C --> D["span (text)"];
    end

    subgraph After
        E["div.ai-button-wrapper"] --> F["button.ai-assist-button"];
        F --> G["BrainIconWithAnimation"];
        F --> H["span (text)"];
    end

    style F fill:#cde,stroke:#333,stroke-width:2px