# Plan to Fix Textbox Expansion Behavior

## 1. Analysis of the Issue

The textareas for "Contributing Causes" and "Potential Assumptions" in `frontend/src/app/SessionWizard.tsx` are expanding horizontally instead of vertically. This is because their parent containers (`.cause-column` and `.assumption-column`) are inside a CSS Grid layout (`.cause-assumption-pair`) and are not configured to shrink below their minimum content size. When a long, unbroken string of text is entered, the textarea's minimum width increases, forcing the grid column to expand horizontally.

## 2. Proposed Solution

To fix this while maintaining the side-by-side layout, we will add the `min-width: 0;` property to the `.cause-column` and `.assumption-column` CSS rules in `frontend/src/app/globals.css`.

This change will allow the grid columns to shrink, forcing the text within the textareas to wrap properly. The existing JavaScript for auto-resizing will then handle the vertical expansion as intended.

### Specific Change:

In `frontend/src/app/globals.css`, the following rule will be modified:

**From:**
```css
.cause-column,
.assumption-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;
  align-items: flex-start;
}
```

**To:**
```css
.cause-column,
.assumption-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;
  align-items: flex-start;
  min-width: 0; /* This line will be added */
}
```

## 3. Next Steps

1.  Save this plan to `text-box-fix-plan.md`.
2.  Switch to **Code Mode**.
3.  Apply the CSS change to `frontend/src/app/globals.css`.