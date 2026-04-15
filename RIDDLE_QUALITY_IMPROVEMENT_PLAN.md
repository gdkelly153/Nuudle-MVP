# Riddle Quality Improvement Plan (V2)

## 1. Problem Analysis

The current riddle generation system has produced a low-quality riddle with a "dream" solution. The core issues are not about specific topics being "cliché," but about the quality of the riddle's construction. The problems to solve are:

1.  **Logical Contradictions:** The riddle's text ("I wake up...") directly contradicted the solution ("...the person is dreaming"). The AI's logic checks are not sufficient to catch these inconsistencies.
2.  **Uninspired Connections:** The "dream" answer is a weak explanation for a surreal scenario. The connection between the riddle's details and the solution was not creative, interesting, or clever.
3.  **Repetition of Concepts:** The AI has a tendency to reuse concepts in different scenarios, leading to a repetitive user experience.

## 2. Proposed Solution: Enhance AI's Critical Reasoning

Instead of forbidding specific concepts, we will enhance the AI's prompts to force a more rigorous evaluation of the riddle's quality, logic, and creativity. The changes will be made in the `generate_core_concept` and `generate_riddle_and_solution` functions in `riddle_generator.py`.

### 2.1. Stricter Logic and Contradiction Checking

We will add a new, explicit set of rules to the `generate_core_concept` prompt that forces the AI to act as a "logic editor" and actively hunt for contradictions.

**Proposed Addition to `generate_core_concept` prompt:**
```
**CRITICAL - Contradiction Analysis:**
Before finalizing your concept, you must perform a contradiction analysis.
1.  **List the core statements of the riddle scenario.** (e.g., "A person wakes up," "Gravity flows upwards").
2.  **List the core elements of the solution.** (e.g., "The person is dreaming").
3.  **Compare them side-by-side.** Is there any statement in the scenario that is logically impossible given the solution? For example, one cannot "wake up" and still be "dreaming." This is a direct contradiction and is not allowed. The solution must explain the scenario, not invalidate it.
```

### 2.2. Mandate a "Creative Connection" Justification

We will modify the `generate_riddle_and_solution` prompt to require the AI to justify *why* the connection between the riddle and solution is creative and satisfying. This forces the AI to evaluate the quality of its own idea.

**Proposed Addition to `generate_riddle_and_solution` prompt:**
```
**CRITICAL - Quality & Creativity Check:**
Before writing the riddle, you must justify why this is a high-quality concept.
1.  **Explain the "Aha!" Moment:** What is the specific, clever realization a user must have to solve this?
2.  **Justify the Connection:** Why is the solution a creative, interesting, and accurate explanation for the scenario described in the riddle?
3.  **Confirm Uniqueness:** How is this concept different from other common riddles? (e.g., If the answer is a common object, the description must be highly unique).
```

### 2.3. Improve Anti-Repetition Instructions

We will clarify the instructions for avoiding repetition to focus on the underlying *mechanic* or *concept* of the riddle, not just the topic.

**Proposed Change to `generate_core_concept` prompt:**
```
- **UNIQUE**: Avoid repeating the underlying solution mechanic from recent riddles. The goal is conceptual variety. For example, if a recent riddle's solution was based on a pun, avoid generating another pun-based riddle. If a recent riddle was about a Monopoly game, avoid other board-game-based solutions for a while. The concept must be completely different from these recent riddles:
```

## 3. Implementation Plan

1.  **Apply Changes:** Modify the `generate_core_concept` and `generate_riddle_and_solution` functions in `Nuudle/nuudle/backend/riddle_generator.py` to include the new prompt sections.
2.  **Testing:** Manually trigger the riddle generation service multiple times to verify that the new rules are being followed and that the quality of the generated riddles has improved.
3.  **Review:** Submit the changes for review.

This revised plan will produce more creative, logical, and satisfying riddles by focusing the AI on the quality of its reasoning rather than on a simple list of forbidden topics.