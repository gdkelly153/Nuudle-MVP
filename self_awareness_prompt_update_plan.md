# Self-Awareness Prompt Update Plan

## 1. The Problem

The current self-awareness detection prompt is too simplistic and is incorrectly identifying self-awareness when none is present. This is because it is triggered by any mention of the user's own feelings or thoughts, rather than a genuine acknowledgment of their role in the problem.

## 2. The Solution

To fix this, we will update the `analyze_self_awareness` function in `backend/ai_service.py` with a more sophisticated prompt and a more robust fallback heuristic.

### 2.1. New AI Prompt

The new prompt will include a "Chain of Thought" to force the AI to reason through its decision step-by-step, and more stringent criteria for what constitutes self-awareness.

```python
analysis_prompt = f"""You are an expert in psychological analysis. Your task is to determine if a user has demonstrated self-awareness of their own role in a problem by analyzing their stated causes.

**CRITICAL ANALYSIS CRITERIA:**

A user demonstrates **true self-awareness** only if they explicitly acknowledge their own actions, behaviors, or mindset as a contributing cause. This means:
- They use "I" statements to describe their own actions (e.g., "I procrastinate," "I react defensively").
- They take ownership of their habits or patterns (e.g., "I have a habit of interrupting people").
- They identify their own limiting beliefs or assumptions (e.g., "I believe I'm not good enough, which makes me avoid challenges").

A user **does NOT demonstrate self-awareness** if their causes are:
- Focused exclusively on external factors (e.g., "The economy is bad").
- Blaming others entirely (e.g., "My partner is the one who is always negative").
- Describing their feelings as a passive experience without acknowledging their role in those feelings (e.g., "I feel unsupported" is NOT self-awareness; "I don't communicate my needs, which leads to me feeling unsupported" IS self-awareness).

**CHAIN OF THOUGHT REASONING:**

Before you provide your final JSON response, you must reason through the following steps:
1.  **Analyze each cause individually:** For each cause, determine if it is internally focused (self-aware) or externally focused (blaming/describing).
2.  **Synthesize your findings:** Based on your analysis of all the causes, determine if the user has demonstrated a pattern of self-awareness.
3.  **Formulate your final answer:** Based on your synthesis, determine the final boolean value for `selfAwarenessDetected` and write a concise reason for your decision.

**User's submitted causes:** "{causes_text}"

**Your JSON Response:**

Respond with a JSON object in this exact format:
{{
  "selfAwarenessDetected": true/false,
  "reason": "Brief explanation of your analysis, including a summary of your chain of thought."
}}

Your response must be valid JSON only, no other text.
"""
```

### 2.2. New Fallback Heuristic

The new fallback heuristic will be more context-aware and will look for more specific patterns of self-awareness.

```python
# Fallback to basic heuristic analysis
self_awareness_keywords = ['i procrastinate', 'i avoid', 'i get defensive', 'i have a habit of', 'i need to stop', 'i always', 'i never']
causes_lower = causes_text.lower()

# Check if any cause contains self-aware language
has_self_awareness = any(keyword in causes_lower for keyword in self_awareness_keywords)

return {
    "success": True,
    "selfAwarenessDetected": has_self_awareness,
    "reason": "Fallback analysis using keyword detection" if has_self_awareness else "No self-referential language detected"
}
```

## 3. Implementation Plan

1.  **Switch to Code Mode.**
2.  **Apply the changes** to `backend/ai_service.py` using the new prompt and fallback heuristic defined above.
3.  **Test the changes** to ensure they are working as expected.