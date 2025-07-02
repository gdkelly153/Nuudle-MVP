# Plan to Revise the "Perpetuation" AI Prompt

The goal is to revise the "Help me reflect on my potential role" prompt to create a safe, reflective space for the user to consider their potential role in a problem without pressure or self-blame. The focus will be on a hypothetical thought exercise.

## 1. Reframe the Core Concept

Shift the prompt's focus from analyzing the user's *self-recognized patterns* to analyzing the *potential impact of hypothetical actions*. The entire exercise will be framed as a strategic exploration, not a confession.

## 2. Update Prompt Components in `api/services/aiService.js`

Modify the headers, dynamic introductory sentences, and the main body of the `perpetuation` prompt.

*   **Headers:** The section titles will be changed to sound more objective and analytical.
*   **Analysis Section:** The AI's task will be to evaluate how effectively the user's listed *hypothetical actions* would perpetuate the problem, rather than validating the user's self-awareness.
*   **Discovery Section:** The focus will be on brainstorming *additional hypothetical actions*, expanding the thought experiment.
*   **Conclusion:** The closing statement will emphasize awareness of one's *potential role* and the power that comes from understanding the system, not just one's own habits.

## 3. Proposed Changes: Examples

### Section Headers (`headers`)

| Current (Before) | Proposed (After) |
| --- | --- |
| `How Your Actions Might Perpetuate the Problem` | `Analyzing the Potential Impact` |
| `Uncovering Deeper Patterns` | `Exploring Other Contributing Actions` |
| `Gaining Self-Awareness for Change` | `Increasing Awareness of Your Potential Role` |

### Analysis Section (`body.analysis`)

**Proposed AI Instruction:**
> "Context: The user is engaging in a thought experiment about how a problem described in '{{painPoint}}' could be perpetuated. Analyze the hypothetical actions they've listed in '{{userInput}}'. For each action, evaluate its potential effectiveness in maintaining or worsening the problem. Frame your analysis from a neutral, strategic perspective. For instance, you might say, 'This action could effectively perpetuate the issue by...' or 'The strategic value of this approach in maintaining the problem would be...'. Avoid language that implies the user is currently performing these actions."

### Discovery Section (`body.discovery`)

**Proposed AI Instruction:**
> "Now, let's expand this thought experiment. To uncover other ways this problem could be sustained, let's brainstorm some additional hypothetical scenarios. Ask 2-3 discovery questions to explore other actions or mindsets that someone might adopt if their goal was to ensure the problem continues. For example: 'What is one thing someone could *stop* doing that would guarantee the problem remains?' or 'What belief could someone hold that would make them passively accept the situation as unchangeable?'"

### Conclusion (`body.conclusion`)

**Proposed Language:**
> `"This thought experiment is designed to increase your awareness of how certain actions—whether active or passive—could play a role in the problem's continuation. Understanding these dynamics is not about assigning blame, but about empowering you with a clearer view of the system, which is the first step toward influencing it effectively."`