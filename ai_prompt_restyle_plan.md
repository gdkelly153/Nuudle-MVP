### Final Plan: AI Prompt Restructuring

1.  **Objective:** To update all AI-generated responses to follow a consistent, four-header structure.
2.  **File to Modify:** `api/services/aiService.js`
3.  **Structural Change:** Each prompt configuration in the `prompts` object will be modified. The `body` of each prompt will be rewritten to include four distinct sections, each with its own thematic Markdown header (`###`).
4.  **Header Theming:** The language of each header will be tailored to the specific context of the prompt (e.g., `root_cause`, `identify_assumptions`).
5.  **Header Format:**
    *   **Header 1: Introduction:** A brief, engaging opening that sets the stage for the thinking exercise.
    *   **Header 2: Analysis of Input:** A section dedicated to analyzing the information the user has provided.
    *   **Header 3: Discovery of Alternatives:** A section to encourage the exploration of new ideas and perspectives.
    *   **Header 4: Thematic Summary:** A concluding header that summarizes the goal of the step without the "Conclusion:" prefix.

Here is the revised example for "Help me identify assumptions" reflecting your feedback:

```markdown
### Surfacing Your Core Beliefs
Our minds use assumptions as shortcuts to make sense of the world, but these are often shaped by our unique experiences and biases. That's why it's so important to test our assumptions—to separate what we think we know from what is actually true.

### Examining Your Stated Assumptions
You've entered these assumptions: '{{userInput}}'. Let's evaluate how valid and relevant they are.
- *[Evaluation and validation steps for assumption 1]*
- *[Evaluation and validation steps for assumption 2]*

### Uncovering Hidden Assumptions
Beyond what you've already identified, it's valuable to consider what other assumptions might be lurking beneath the surface of your thinking.
- *[Action-oriented validation question 1]*
- *[Action-oriented validation question 2]*

### Grounding Your Perspective in Reality
Reflecting on these validation steps will help you build a more solid foundation for your thinking and next actions, ensuring your approach is based on evidence, not just perception.