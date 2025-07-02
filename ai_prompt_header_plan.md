# Plan: Adding Insightful Headers to AI Prompts

This document outlines the plan to add headers to the AI prompt responses to improve clarity and structure.

## Goal

The primary goal is to add four distinct headers (Intro, Analysis, Discovery, Conclusion) to each of the five dynamic AI prompt responses without altering the core logic that generates the content for each section.

## Approach

1.  **Modify `prompts` Object:** A `headers` object will be added to each of the five dynamic prompt configurations (`root_cause`, `identify_assumptions`, `potential_actions`, `perpetuation`, `action_planning`) within the `prompts` object in `api/services/aiService.js`.
2.  **Update `getResponse` Function:** The prompt assembly logic in the `getResponse` function will be updated to incorporate these new headers into the final prompt sent to the AI.
3.  **Header Placement:**
    *   The **Intro Header** will be placed at the very beginning of the AI response.
    *   The **Analysis, Discovery, and Conclusion Headers** will be inserted at the appropriate points within the body of the response to structure the content logically.

## Approved Header Content

The following headers have been approved for each stage:

### `root_cause`
*   **Intro:** `### Uncovering the 'Why' Behind the 'What'`
*   **Analysis:** `### Examining Your Stated Causes`
*   **Discovery:** `### Exploring Unseen Connections`
*   **Conclusion:** `### Focusing on Foundational Drivers`

### `identify_assumptions`
*   **Intro:** `### Surfacing Your Hidden Beliefs`
*   **Analysis:** `### Testing Your Assumptions`
*   **Discovery:** `### What Else Might You Be Assuming?`
*   **Conclusion:** `### Building on a Foundation of Truth`

### `potential_actions`
*   **Intro:** `### Charting Your Course from Insight to Action`
*   **Analysis:** `### Refining Your Drafted Actions`
*   **Discovery:** `### Brainstorming Alternative Paths`
*   **Conclusion:** `### Committing to an Effective Plan`

### `perpetuation`
*   **Intro:** `### Examining Your Role in the System`
*   **Analysis:** `### How Your Actions Might Perpetuate the Problem`
*   **Discovery:** `### Uncovering Deeper Patterns`
*   **Conclusion:** `### Gaining Self-Awareness for Change`

### `action_planning`
*   **Intro:** `### Turning Fear into Confident Action`
*   **Analysis:** `### Evaluating Your Fears and Plans`
*   **Discovery:** `### Building Confidence and Shifting Perspective`
*   **Conclusion:** `### Moving Forward with Clarity`