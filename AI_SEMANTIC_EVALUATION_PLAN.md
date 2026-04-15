# Plan: AI Semantic Evaluation for Riddles

## 1. The Problem

The current AI is too literal. It correctly identifies questions but fails to recognize when a question contains a key part of the solution (e.g., "deck of cards"). This is because it lacks a deeper, semantic understanding of the riddle's context.

## 2. The Solution: A Semantic Context Approach

I will implement a new system that provides the AI with a "semantic context" for each riddle. This will allow it to recognize key concepts and guide the user more intelligently.

### Part 1: New `solution_context` Field

**1.1. New Riddle Generation Prompt (`riddle_generator.py`)**
The AI prompt will be updated to require a new `solution_context` field.

**New Prompt Snippet:**
```
**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "riddle_text": "...",
  "solution": "...",
  "difficulty": "...",
  "category": "...",
  "solution_components": [ ... ],
  "solution_context": [
    "keyword or concept 1",
    "keyword or concept 2",
    "keyword or concept 3"
  ]
}

**CRITICAL:** The `solution_context` should be a list of 3-5 keywords, objects, or themes that are essential to understanding the solution but are not explicitly mentioned in the riddle.
```

**Example for the Bicycle Riddle:**
```json
{
  ...
  "solution_context": ["playing cards", "deck of cards", "cheating", "card game", "Bicycle brand"]
}
```

**1.2. Updated Data Model (`models.py`)**
The `DailyRiddle` model will be updated to include the new field.

**Updated `DailyRiddle` Model:**
```python
class DailyRiddle(BaseModel):
    ...
    solution_components: List[str] = []
    solution_context: List[str] = []
    ...```

### Part 2: New Two-Stage AI Evaluation

The `get_riddle_question_response` function in `ai_service.py` will be updated with a new, two-stage prompt.

**New Evaluation Prompt:**
```
You are an AI assistant for a riddle game. Your goal is to answer the user's yes/no question based on the riddle's solution and its semantic context.

**Riddle Solution:** {solution}
**Solution Context Keywords:** {solution_context}
**User's Question:** {user_question}

**Two-Stage Analysis:**

**Stage 1: Semantic Relevance Check**
- First, check if the user's question contains any of the keywords from the Solution Context Keywords list.

**Stage 2: Context-Aware Response**
- If the question contains a context keyword, you MUST answer "Yes". This is to guide the user in the right direction.
- If the question does not contain a context keyword, answer "Yes" or "No" based on the riddle's solution.

**Your Response:**
Respond with ONLY the word "Yes" or "No".
```

### Part 3: Updated Backend Logic

The `process_riddle_question` function in `main.py` will be updated to:
1.  Fetch the `solution_context` from the riddle document.
2.  Pass the `solution_context` to the `get_riddle_question_response` function.

## 3. Visual Flowchart

This Mermaid diagram illustrates the new, two-stage semantic evaluation process:

```mermaid
graph TD
    A[User Asks Question] --> B{Get Riddle & Solution Context};
    B --> C{Call AI with 2-Stage Prompt};
    C --> D{AI Checks for Context Keywords};
    D -- Keyword Found --> E[Return "Yes"];
    D -- No Keyword Found --> F{AI Evaluates Against Solution};
    F --> G[Return "Yes" or "No"];
```

This new system will allow the AI to intelligently guide users toward the solution by recognizing key concepts, even when they are phrased as questions.