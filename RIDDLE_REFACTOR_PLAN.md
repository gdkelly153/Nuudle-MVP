# Comprehensive Riddle Generation Refactor Plan (Final)

## 1. Executive Summary

Our recent experience with a low-quality "dream" riddle has highlighted systemic weaknesses in our riddle generation prompts. The current rules are too specific, leading to iterative, reactive patches. This plan outlines a holistic refactor of the entire riddle generation pipeline in `riddle_generator.py`.

The goal is to move from a prescriptive, rule-based system to a principled, reasoning-based system. We will empower the AI to act as a critical thinker, a logic editor, and a creative writer by providing it with frameworks for self-evaluation rather than just lists of forbidden topics. This will result in consistently logical, creative, and satisfying riddles.

## 2. Audit Findings & Proposed Changes

This audit covers the three core stages of riddle generation.

### Stage 1: Core Concept Generation (`generate_core_concept`)

*   **Finding:** The current "Logic Check" is a passive suggestion. The anti-repetition rule is focused on topics, not underlying mechanics.
*   **Proposed Refactor:** We will replace the existing checks with a more robust, active reasoning framework.

**New Prompt Section for `generate_core_concept`:**

```
**CRITICAL - Quality & Logic Framework:**
Before finalizing your concept, you must validate it against these principles:

1.  **Principle of Logical Soundness:** The solution must be a plausible, internally consistent explanation for the scenario.
    *   **Contradiction Test:** Explicitly list the claims made in the riddle's premise (e.g., "a person wakes up") and compare them against the solution (e.g., "the person is dreaming"). If any premise is invalidated by the solution, the concept is **invalid**. The solution must explain the premise, not erase it.

2.  **Principle of Creative Connection:** The relationship between the riddle and the solution must be clever and insightful.
    *   **"Aha!" Moment Analysis:** Briefly describe the specific, non-obvious realization or "leap" a user must make. A simple description (e.g., "the object is a fan") is not a creative connection. A clever misdirection (e.g., "a man pushes his car" but is playing Monopoly) is a strong connection.

3.  **Principle of Conceptual Uniqueness:** The underlying mechanic of the riddle should be novel.
    *   **Mechanic Analysis:** Instead of just avoiding topics, identify the *type* of thinking required (e.g., "pun-based," "metaphorical," "context shift," "scientific principle"). Compare this mechanic to recent riddles to ensure variety in *how* users must think.
```

### Stage 2: Riddle & Solution Crafting (`generate_riddle_and_solution`)

*   **Finding:** The current prompt focuses heavily on style (Narrative vs. Poetic) but doesn't sufficiently enforce that every detail must be a meaningful clue.
*   **Proposed Refactor:** We will introduce a "Clue Integrity" rule that focuses on substantive phrases.

**New Prompt Section for `generate_riddle_and_solution`:**

```
**CRITICAL - Clue Integrity Rule:**
Every substantive phrase, descriptor, and statement in the riddle text must be a deliberate, verifiable clue that points toward the solution. While grammatical connecting words (like 'and', 'the', 'with') are necessary for prose, all descriptive elements must serve a logical purpose. There should be no atmospheric or misleading descriptions that do not connect to the solution. After writing the riddle, you must perform a "retrospective analysis": for each key phrase or descriptor, explain how it logically connects to the solution once the answer is known.
```

### Stage 3: Component Extraction (`extract_solution_components`)

*   **Finding:** The current prompt is effective but can be improved by ensuring the components represent a logical path of discovery.
*   **Proposed Refactor:** We will add a rule to structure the components as a "path to solution."

**New Prompt Section for `extract_solution_components`:**

```
**CRITICAL - Path to Solution:**
The components must be ordered as a logical sequence of discoveries. The first component should be the initial key insight, and each subsequent component should build upon the last, leading the user step-by-step to the final answer. The components should represent the ideal "train of thought" for solving the riddle.
```

## 3. Implementation & Next Steps

1.  **Approve Plan:** This plan is submitted for your review and approval.
2.  **Implement Changes:** Upon approval, I will switch to "Code" mode to apply these changes to the prompts in `Nuudle/nuudle/backend/riddle_generator.py`.
3.  **Test & Verify:** After implementation, we will need to generate a batch of new riddles to confirm that the AI is adhering to the new, more robust framework and that the overall quality has improved.