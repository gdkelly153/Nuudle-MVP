# Plan to Refactor SessionCard Component

This plan outlines the steps to refactor the `SessionCard.tsx` component to correctly display the "Contributing Cause" and "Potential Assumption" sections.

## 1. Restructure `SessionCard.tsx`

The main goal is to move the labels outside of the bordered container.

### Current Structure (Simplified):

```jsx
<div>
  <strong>Issue Tree:</strong>
  {/* ... */}
</div>
<div>
  <strong>Assumptions:</strong>
  {/* ... */}
</div>
```

### New Structure (Simplified):

```jsx
<div className="cause-assumption-section">
  <div className="cause-column">
    <h4 className="column-label">Contributing Cause</h4>
    <div className="items-box">
      {/* ... list of causes ... */}
    </div>
  </div>
  <div className="assumption-column">
    <h4 className="column-label">Potential Assumption</h4>
    <div className="items-box">
      {/* ... list of assumptions ... */}
    </div>
  </div>
</div>
```

## 2. Update `globals.css`

I will add the following CSS to `frontend/src/app/globals.css` to style the new structure.

```css
.cause-assumption-section {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cause-column, .assumption-column {
  width: 48%;
  text-align: center;
}

.column-label {
  margin-bottom: 10px;
  font-weight: bold;
}

.items-box {
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 100px;
}
```

## 3. Modify `SessionCard.tsx`

I will apply the following changes to `frontend/src/components/SessionCard.tsx`:

-   Remove the existing "Issue Tree" and "Assumptions" sections.
-   Add the new two-column layout.
-   Map over `session.issue_tree.sub_causes` for the "Contributing Cause" list.
-   Map over `session.assumptions` for the "Potential Assumption" list.

This will result in the desired layout with the labels outside the bordered boxes.