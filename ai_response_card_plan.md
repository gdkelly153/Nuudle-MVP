# Plan: AI Response Card Redesign

The goal is to transform the current, simple blue-themed AI response box into a more sophisticated, branded card that enhances readability and user experience.

## 1. New Component Structure

I will restructure the `AIResponseCard` to be more modular and visually organized, with distinct header, body, and footer sections. This separation will create a clearer information hierarchy.

Here is a diagram illustrating the proposed structure for the new component:

```mermaid
graph TD
    subgraph New AIResponseCard Structure
        direction TB
        A[Card Container (.ai-response-card-new)] --> B{Header (.ai-response-header)};
        A --> C{Body (.ai-response-body)};
        A --> D{Footer (.ai-response-footer)};

        B --> B1[Title: "Nuddle AI"];
        B --> B2[Collapse & Dismiss Buttons];

        C --> C1[AI Response (Markdown Content)];

        D --> D1[Feedback Buttons ("This helps", "Not helpful")];
        D --> D2[Follow-up Link];
    end
```

## 2. Styling with Brand Colors

I will create new CSS classes in `frontend/src/app/globals.css` to style the new structure, leveraging your established brand colors and styles for a consistent look and feel.

*   **`.ai-response-card-new`**: The main container will use your secondary background color, a subtle border, and a shadow using the `--golden-mustard` focus color to make it pop.
*   **`.ai-response-header`**: The header will use the `--golden-mustard` color for the title, establishing a clear brand presence. A bottom border will separate it from the content.
*   **`.ai-response-body`**: This section will have comfortable padding for the AI-generated text, ensuring readability.
*   **`.ai-response-footer`**: The footer will house the action buttons, visually separating them from the response content with a top border and a slightly different background.

## 3. Implementation Steps

1.  **Update CSS:** Add the new classes (`.ai-response-card-new`, `.ai-response-header`, etc.) to `frontend/src/app/globals.css`.
2.  **Refactor Component:** Modify the `AIResponseCard` component in `frontend/src/components/AIComponents.tsx` to use the new CSS classes and the Header/Body/Footer HTML structure.

This approach will result in an AI response card that is not only more visually appealing but also feels like an integrated part of the Nuudle application.