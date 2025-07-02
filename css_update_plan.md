# Plan: Revert and Update CSS for Auto-Resizing Textarea

1.  **Target File:** [`frontend/src/app/globals.css`](frontend/src/app/globals.css)

2.  **Objective:** Revert the recent changes to the `.auto-resizing-textarea` CSS class and apply a new, simplified set of rules.

3.  **Detailed Steps:**
    *   I will locate the following CSS block in [`frontend/src/app/globals.css`](frontend/src/app/globals.css:145):
        ```css
        .auto-resizing-textarea {
          width: 100% !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }
        ```
    *   I will replace it with the new styles you provided:
        ```css
        .auto-resizing-textarea {
          overflow-wrap: break-word;
          word-break: break-word;
        }
        ```
    *   This action will remove the `width`, `max-width`, and `!important` declarations, leaving only the word wrapping rules.

Here is a Mermaid diagram illustrating the plan:

```mermaid
graph TD
    A[Start] --> B{Locate `.auto-resizing-textarea` in `globals.css`};
    B --> C[Replace existing CSS rules];
    C --> D{New rules: `overflow-wrap: break-word;` and `word-break: break-word;`};
    D --> E[End];