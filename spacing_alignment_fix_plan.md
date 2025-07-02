# Plan to Fix Spacing and Vertical Alignment

This plan addresses two issues:
1.  The large space between the "Contributing Cause" section and the "My Contributions" section.
2.  The vertical alignment of text in the "My Contributions" and "Possible Action" textareas.

## Spacing Issue Solution

To fix the spacing, I will remove the `margin-top` from the `.my-contributions-section` class.

### Implementation

1.  Remove the `margin-top` property from the `.my-contributions-section` CSS class in `frontend/src/app/SessionWizard.tsx`.

## Vertical Alignment Issue Solution

To vertically center the text in the textareas, I will apply flexbox properties to the textareas themselves.

### Implementation

1.  Add the following properties to the `.auto-resizing-textarea` class in `frontend/src/app/SessionWizard.tsx`:
    ```css
    display: flex;
    align-items: center;