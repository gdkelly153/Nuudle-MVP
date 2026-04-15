# Implementation Plan V2: Daily Riddle System Fix

## 1. Objective

This plan addresses the critical failures identified in `RCA.md`. The primary goals are:
1.  **Fix the Triage AI:** Correctly classify confirmation questions as SOLUTION attempts.
2.  **Implement Frontend UI:** Display multi-part solution progress to the user.
3.  **Ensure Data Flow:** Connect the backend data to the frontend UI.

## 2. Backend Implementation

### 2.1. `ai_service.py`: Rewrite Triage AI Prompt

The `triage_classify_input` function will be updated with a more explicit prompt.

**New Prompt Logic:**
- **Rule 1 (Solution First):** If the input contains the solution, classify as SOLUTION.
- **Rule 2 (Confirmation Questions):** If the input is a question that proposes a potential answer (e.g., "Is it X?"), classify as SOLUTION.
- **Rule 3 (Information-Gathering Questions):** If the input is a question that asks about properties without proposing an answer, classify as QUESTION.

This new logic will be implemented in the `triage_prompt` variable.

### 2.2. `main.py`: Update API Response Model

The `RiddleSubmissionResponse` model will be updated to include the necessary data for the frontend.

**New `RiddleSubmissionResponse` Model:**
```python
class RiddleSubmissionResponse(BaseModel):
    submission_type: str
    response: str
    is_correct: Optional[bool] = None
    reasoning: Optional[str] = None
    solved_components: Optional[List[int]] = []
    total_components: Optional[int] = 0
```

The `process_riddle_submission` function will be updated to populate these new fields in its return statement.

## 3. Frontend Implementation

### 3.1. `page.tsx`: State Management and UI

The main riddle page will be updated to handle the new data and display the progress.

**New State Variables:**
```typescript
const [solvedComponents, setSolvedComponents] = useState<number[]>([]);
const [totalComponents, setTotalComponents] = useState<number>(0);```

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
)}```

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

[ ] **Backend:** Rewrite the Triage AI prompt in `ai_service.py`.
[ ] **Backend:** Update the `RiddleSubmissionResponse` model in `main.py`.
[ ] **Backend:** Update the `process_riddle_submission` function in `main.py` to return the new data.
[ ] **Frontend:** Add `solvedComponents` and `totalComponents` state to `page.tsx`.
[ ] **Frontend:** Update the `handleSubmit` function in `page.tsx` to handle the new data.
[ ] **Frontend:** Add the progress bar UI component to `page.tsx`.
[ ] **Frontend:** Add the new CSS classes to `DailyRiddle.module.css`.
[ ] **Testing:** Manually test the "bicycle" riddle scenario.