# Riddle AI Logic and UI Fix Plan (V3)

This version incorporates user feedback to create a more intelligent and user-friendly AI evaluation system, avoiding the pitfalls of an "Unclear" response.

## Issues Identified & Final Solutions

### 1. AI Logic Error - Intelligent Intent Analysis
**Problem**: The AI struggles with ambiguous questions, leading to incorrect "Yes/No" answers. Previous solutions were either too prescriptive or not user-friendly.

**Root Cause**: The AI prompt lacks a sophisticated reasoning process to disambiguate user intent based on context.

**Final Solution**:
We will implement a "Chain of Thought" reasoning model in the AI prompt. Instead of defaulting to "Unclear," the AI will now perform a multi-step analysis to determine the user's most probable intent and answer accordingly.

**New AI Logic:**
1.  **Identify Potential Meanings**: The AI will first identify the different possible interpretations of a keyword (e.g., "state" could mean physical or operational).
2.  **Analyze Contextual Clues**: It will then analyze the entire question for contextual clues that favor one interpretation over another (e.g., the word "solid" strongly implies a physical state).
3.  **Make an Educated Decision**: Based on the clues, the AI will select the most probable interpretation and answer "Yes" or "No" based on that meaning.
4.  **Explain Its Reasoning (for logging)**: The AI will provide a brief explanation of its decision-making process, which we can use for logging and future improvements.

This approach makes the AI smarter, prevents incorrect answers, and avoids confusing the user with an "Unclear" response.

### 2. Riddle Quality Issue - Enhancing Story Form Riddles
**Problem**: "Story form" riddles are not consistently engaging or mysterious.

**Root Cause**: The riddle generation prompts do not enforce the criteria for a high-quality narrative riddle, specifically the need for multiple, interconnected clues.

**Final Solution**:
- **Mandate 3-5 Components**: Hard/narrative riddles will be required to have 3-5 distinct `solution_components`.
- **Enforce Story Cohesion**: The components must logically build on each other to tell a complete story.
- **Improve Style Selection**: The `generate_riddle_and_solution` prompt will be updated to only select the NARRATIVE style for concepts that support a multi-component story.

### 3. UI Issue - Scrollbar Styling
**Problem**: The scrollbar in the Question History section is visually jarring and overlaps with text.

**Root Cause**: The scrollbar uses default browser styling.

**Final Solution**: Add custom CSS to style the scrollbar to be smaller, darker, and properly spaced.

## Implementation Plan

### Phase 1: Implement Intelligent Intent Analysis in AI Logic

**File**: `Nuudle/nuudle/backend/ai_service.py`
**Function**: `get_riddle_question_response()`

**Changes**: Replace the existing prompt with this new "Chain of Thought" version.

```python
# Replace the prompt in get_riddle_question_response (lines 2342-2382) with this:

riddle_prompt = f"""You are an AI assistant for a riddle game. Your task is to intelligently analyze a user's question and provide an accurate "Yes" or "No" response.

**Riddle Solution:** "{riddle_solution}"
**User's Question:** "{question}"

**Your "Chain of Thought" Analysis Process:**

**Step 1: Identify Potential Meanings**
Analyze the user's question for any words that could be ambiguous. For example, "state" could mean physical state (solid/liquid/gas) or operational state (on/off).

**Step 2: Analyze Contextual Clues**
Look for other words in the question that clarify the user's intent. For example, if the user asks, "Is the object's state, a solid?", the word "solid" is a strong clue that they are asking about the physical state.

**Step 3: Make an Educated Decision**
Based on the contextual clues, choose the most probable interpretation of the question.

**Step 4: Determine the Final Answer**
Based on your chosen interpretation, is the answer to the question "Yes" or "No"?

**Step 5: Format the Final Output**
Return a JSON object with your final answer and a brief explanation of your reasoning.

**Example Analysis for Riddle Solution "A powerful fan":**

- **User Question:** "Is the object's state, a solid?"
- **Chain of Thought:**
  1.  **Potential Meanings:** "State" could mean physical state or operational state.
  2.  **Contextual Clues:** The user also said "a solid," which strongly points to physical state.
  3.  **Educated Decision:** The user is asking if the fan is a solid object.
  4.  **Final Answer:** A fan is a solid object, so the answer is "Yes".
- **JSON Output:**
  ```json
  {{
    "answer": "Yes",
    "reasoning": "The user specified 'a solid,' indicating they are asking about the physical state of the object. A fan is a solid object."
  }}
  ```

**Your Task:**
Analyze the user's question now and return a JSON object with your answer and reasoning.

**CRITICAL:** Return ONLY the JSON object, with no other text or formatting.
```

### Phase 2: Improve Riddle Quality and Story Form Criteria

**File**: `Nuudle/nuudle/backend/riddle_generator.py`

**Changes**:
1.  **`extract_solution_components` prompt (around line 350)**: Enforce 3-5 components for "Hard" riddles.
2.  **`generate_riddle_and_solution` prompt (around line 230)**: Update the "Style Selection Rubric" to prioritize NARRATIVE style for multi-component stories only.

*(No changes from V2 for this section, as the logic was sound)*

### Phase 3: Fix Scrollbar UI/UX

**File**: `Nuudle/nuudle/frontend/src/app/daily-riddle/DailyRiddle.module.css`

**Changes**:
1.  Add custom scrollbar styling for WebKit and Firefox.
2.  Add right padding and a gap to `.historyItem` to prevent text overlap.

*(No changes from V2 for this section, as the logic was sound)*