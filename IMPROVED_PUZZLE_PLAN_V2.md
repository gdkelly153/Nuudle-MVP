# V2: Improved Puzzle Generation and AI Logic Plan

This plan addresses the root cause of poor puzzle quality by shifting from negative constraints to a positive creative framework.

## 1. The Core Problem: Pattern-Matching vs. Understanding

The AI defaults to "cop-out" scenarios (dreams, illusions) because they are common patterns in its training data for resolving impossible situations. Simply forbidding these tropes (negative constraints) causes the AI to find the next closest pattern.

The solution is to provide a strong **positive creative framework** that forces the AI to generate puzzles based on the principles of the high-quality examples provided.

## 2. New Puzzle Generation Framework (`puzzle_generator.py`)

The prompts will be re-engineered to enforce a "Grounded Reality" principle.

### Prompt Enhancements:

1.  **Introduce "Grounded Reality" Principle:** The AI will be explicitly instructed that all puzzles must have solutions that are logical, physically possible, and grounded in a clever manipulation of perspective, context, or assumptions—not a suspension of reality.
2.  **Mandatory Analysis of Good Examples:** Before generating a puzzle, the AI will be forced to analyze the principles of the user-provided examples (e.g., the Monopoly game, the bartender curing hiccups). It will have to explain *why* these are good puzzles before it can create its own.
3.  **Strict "No Cop-Outs" Rule:** The list of forbidden tropes will be expanded and made more explicit:
    - **NO** optical illusions, reflections, or visual tricks.
    - **NO** dreams, hallucinations, or altered mental states.
    - **NO** amnesia or memory loss.
    - **NO** scenarios that rely on the character being a ghost, robot, or non-human in a deceptive way.
    - **NO** solutions that are simply misunderstandings of common words (puns are acceptable if clever).
    - **ALL** solutions must be physically and logically plausible in the real world.

## 3. Backend Logic Overhaul (`main.py`)

The submission processing logic will be updated to be more context-aware and less rigid.

### New Submission Flow:

1.  **Holistic AI Analysis:** A new `analyze_puzzle_submission` function will be created. This function will analyze the user's input against the full context of the puzzle (solution, components, and conversation history) in a single, powerful AI call.
2.  **Nuanced Responses:** The AI will be empowered to provide more intelligent responses beyond "Yes/No," such as "You're on the right track," or "That's an interesting idea, but how does it explain X?"
3.  **Contextual Clue Discovery:** Clues will be unlocked based on this holistic analysis, not a simple semantic match.

## 4. Implementation Todo List

- [ ] **Phase 1: Puzzle Generation (`puzzle_generator.py`)**
    - [ ] Rewrite the `generate_core_concept` prompt to include the "Grounded Reality" principle, mandatory analysis of good examples, and the expanded "No Cop-Outs" rule.
    - [ ] Update the `extract_solution_components` prompt to prioritize 2-4 high-quality, essential clues.
- [ ] **Phase 2: Backend (`main.py`)**
    - [ ] Create a new `analyze_puzzle_submission` function in `ai_service.py`.
    - [ ] Update the `process_puzzle_submission` endpoint in `main.py` to use this new function.
- [ ] **Phase 3: Testing**
    - [ ] Generate a batch of 5-10 puzzles to verify that the new quality standards are being met.
    - [ ] Rigorously test the submission process with various questions to ensure the AI responds intelligently and contextually.