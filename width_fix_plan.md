# Plan to Fix "My Contributions" Textbox Width

The goal is to make the "My Contributions" textbox the same width as the "Possible Action" textboxes.

## Recommended Solution (Option 1)

The chosen solution is to apply a specific CSS class with a `max-width` to the "My Contributions" `textarea`.

### Implementation Steps

1.  **Switch to Code Mode:** Switch to Code mode to edit `frontend/src/app/SessionWizard.tsx`.
2.  **Add CSS Class:** Add the following CSS class to the `<style>` block in the file:
    ```css
    .single-column-width {
      max-width: 50%;
      margin-left: auto;
      margin-right: auto;
    }
    ```
3.  **Apply Class:** Add the `single-column-width` class to the `className` of the "My Contributions" `textarea`.