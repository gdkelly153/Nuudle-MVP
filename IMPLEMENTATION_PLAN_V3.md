# Implementation Plan V3: Daily Riddle System Fix

## 1. Objective

This plan addresses the critical failures identified in `RCA_V2.md`. The primary goals are:
1.  **Fix Data Integrity:** Ensure multi-part riddle data is correctly saved to the database.
2.  **Fix Data Flow:** Ensure the AI functions receive the correct data.
3.  **Implement Frontend UI:** Display multi-part solution progress to the user.

## 2. Backend Implementation

### 2.1. `riddle_generator.py`: Fix Data Integrity

The `generate_and_store_daily_riddle` function will be corrected to properly pass the full `riddle_data` dictionary to the `store_daily_riddle` function.

### 2.2. `main.py`: Fix Data Flow

The `process_riddle_submission` function will be updated to correctly extract `solution_components` and `solution_context` from the `riddle` object and pass them to the AI functions.

## 3. Frontend Implementation

### 3.1. `page.tsx`: State Management and UI

The main riddle page will be updated to handle the new data and display the progress.

**New State Variables:**
```typescript
const [solvedComponents, setSolvedComponents] = useState<number[]>([]);
const [totalComponents, setTotalComponents] = useState<number>(0);
```

**`handleSubmit` Logic:**
- The `handleSubmit` function will be updated to destructure `solved_components` and `total_components` from the API response.
- It will then update the new state variables.
- It will check if `solved_components.length` has increased to show a "You're on the right track!" message.

**New UI Component:**
A new progress bar component will be added to the JSX to display the number of solved components.

```jsx
{totalComponents > 0 && (
  <div className={styles.progressContainer}>
    <h3>Progress</h3>
    <div className={styles.progressBar}>
      <div
        className={styles.progressFill}
        style={{ width: `${(solvedComponents.length / totalComponents) * 100}%` }}
      />
    </div>
    <span>{solvedComponents.length} of {totalComponents} components found</span>
  </div>
)}
```

### 3.2. `DailyRiddle.module.css`: New Styles

New CSS classes will be added to style the progress bar and its container.

**New CSS Classes:**
- `.progressContainer`
- `.progressBar`
- `.progressFill`

## 4. Validation and Testing

After implementation, the system will be tested with the "bicycle" riddle scenario to validate the fix.

**Expected Outcome:**
1.  User submits: "Are the 52 bicycles a deck of cards?"
2.  **Backend:**
    - Triage AI classifies as SOLUTION.
    - Semantic AI matches the component.
    - API returns `submission_type: "solution"`, `response: "You're on the right track!..."`, `solved_components: [0]`, `total_components: 4`.
3.  **Frontend:**
    - Progress bar updates to 1/4.
    - "You're on the right track!..." message is displayed.

## 5. Todo List for Implementation

[ ] **Backend:** Correct the `generate_and_store_daily_riddle` function in `riddle_generator.py`.
[ ] **Backend:** Correct the `process_riddle_submission` function in `main.py`.
[ ] **Frontend:** Add `solvedComponents` and `totalComponents` state to `page.tsx`.
[ ] **Frontend:** Update the `handleSubmit` function in `page.tsx` to handle the new data.
[ ] **Frontend:** Add the progress bar UI component to `page.tsx`.
[ ] **Frontend:** Add the new CSS classes to `DailyRiddle.module.css`.
[ ] **Testing:** Manually test the "bicycle" riddle scenario.