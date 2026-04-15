# Plan: Multi-Part Riddle Solutions

## 1. The Problem

Hard riddles often have multi-part answers, but our current system only supports a single string solution. This makes it impossible to track progress on complex riddles and provide a satisfying user experience.

## 2. The Solution: A Multi-Component Framework

I will implement a new system that treats solutions as a list of components. This will involve changes to the AI, the backend data models and logic, and the frontend UI.

### Part 1: AI and Data Structure

**1.1. New Riddle Generation Prompt (`riddle_generator.py`)**
The AI prompt will be updated to require a structured solution for Hard riddles.

**New Prompt Snippet:**
```
**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "riddle_text": "The riddle question here",
  "solution": "A brief, one-sentence summary of the solution",
  "difficulty": "Easy/Medium/Hard",
  "category": "One of the categories listed above",
  "solution_components": [
    "First part of the solution",
    "Second part of the solution",
    "Third part of the solution"
  ]
}

**CRITICAL:** For "Hard" riddles, you MUST break the solution down into 2-4 distinct `solution_components`. For "Easy" or "Medium" riddles, this can be an array with a single string.
```

**1.2. New Data Model (`models.py`)**
The `DailyRiddle` model will be updated to store the structured solution.

**Updated `DailyRiddle` Model:**```python
class DailyRiddle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    riddle_text: str
    solution: str  # This will now be a summary
    solution_components: List[str] = []
    date: str  # YYYY-MM-DD
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**1.3. New AI Evaluation Prompt (`ai_service.py`)**
The `evaluate_riddle_solution_with_ai` function will get a new prompt to check against a list of unsolved components.

**New Evaluation Prompt:**```
You are an AI judge for a riddle game. The user is trying to guess one of the unsolved parts of a multi-part answer.

**Full Answer:** {full_solution}
**Unsolved Parts:** {unsolved_components}
**User's Guess:** {user_guess}

**Task:**
Determine if the user's guess correctly identifies one of the unsolved parts. Respond with a JSON object:
{
  "is_correct": true/false,
  "matched_component": "The component that was correctly guessed, or null"
}
```

### Part 2: Backend Logic

**2.1. New API Response (`main.py`)**
The `/api/v1/riddles/daily` endpoint will now return the solution structure.

**New `DailyRiddleResponse`:**
```python
class DailyRiddleResponse(BaseModel):
    id: str
    riddle_text: str
    date: str
    solution_components: List[str]
    solved_components: List[str]
    is_solved: bool = False
```

**2.2. Updated Session State (`main.py`)**
The `RiddleSession` will now track solved components. I'll add a `solved_components` list to the session document in MongoDB.

**2.3. Updated Evaluation Logic (`main.py`)**
The `process_riddle_submission` function will be updated to:
1.  Fetch the user's session, including the list of already `solved_components`.
2.  Determine the list of `unsolved_components`.
3.  Call the AI to check the user's guess against the `unsolved_components`.
4.  If the AI returns `is_correct: true`, add the `matched_component` to the session's `solved_components`.
5.  Check if the count of `solved_components` now equals the total number of `solution_components`. If so, mark the entire riddle as solved.

### Part 3: Frontend UI/UX

**3.1. New "Solution Progress" Component (`page.tsx`)**
I will add a new section below the question history to display the solution progress.

**Initial State:**
```
[Solution Part 1 of 3]
[Solution Part 2 of 3]
[Solution Part 3 of 3]
```

**3.2. Dynamic Updates**
When the API returns that a new component has been solved, the frontend will update to show its text.

**Partially Solved State:**
```
[He was cheating at a card game.]
[Solution Part 2 of 3]
[Solution Part 3 of 3]
```

**3.3. Updated "Solved" State**
The "Correct!" message, confetti, and disabled input will only trigger when `is_solved` is true for the entire riddle.

## 4. Visual Flowchart

This Mermaid diagram illustrates the new multi-part evaluation flow:

```mermaid
graph TD
    A[User Submits Guess] --> B{Is it a SOLUTION?};
    B -- Yes --> C{Get Session & Unsolved Components};
    C --> D{Call AI to Check Guess vs. Unsolved};
    D --> E{AI Response: Correct?};
    E -- Yes --> F{Add to Solved Components};
    F --> G{All Components Solved?};
    G -- Yes --> H[Mark Riddle as Solved];
    G -- No --> I[Return Updated Progress];
    E -- No --> J[Return "Incorrect"];
```

This system will create a much more satisfying and engaging experience for complex riddles.