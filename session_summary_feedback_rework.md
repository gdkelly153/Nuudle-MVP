# Plan: Rework Session Summary Feedback

## 1. Objective

To rework the "Feedback on Your Approach" section of the AI-generated session summary. The goal is to move away from generic, confidence-boosting statements and toward a sharp, analytical assessment of the user's thinking process.

The feedback will be structured into two sections: **Strengths** and **Areas for Growth**. Both sections will evaluate the user's performance against four specific, measurable dimensions:
1.  **Root Cause Identification:** How well did the user distinguish between symptoms and true, underlying root causes?
2.  **Assumption Surfacing:** How effectively did the user identify and challenge their own hidden beliefs and assumptions?
3.  **Self-Awareness (from Perpetuations):** How clearly did the user recognize and take ownership of their own behaviors in perpetuating the problem, as explored in the "Perpetuations" thought experiment?
4.  **Action Plan Quality:** How specific, measurable, and directly linked to the root causes was the user's final action plan?

## 2. Backend Changes: `api/services/aiService.js`

The core of the implementation is a significant update to the `session_summary` prompt sent to the Anthropic API. The `feedback` object within the JSON structure will be redefined as follows.

### New `feedback` Prompt Structure:

```json
"feedback": {
  "strengths": "Provide a concise analysis of where the user's thinking was most effective. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? (e.g., 'You effectively identified that the team's missed deadlines were not just a time management issue, but a symptom of unclear project requirements.'). 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? (e.g., 'You successfully surfaced the hidden assumption that asking for help is a sign of weakness, which was limiting your options.'). 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and, crucially, acknowledge their own role in any of them? (e.g., 'You showed strong self-awareness by not only identifying 'procrastinating on difficult feedback' as a way to perpetuate the problem but also acknowledging this is a current behavior you need to address.'). 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? (e.g., 'Your action plan to 'schedule a kickoff meeting to define requirements' is a concrete step that directly addresses the root cause you identified.'). Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs.",
  "areas_for_growth": "Provide a concise, constructive analysis of where the user's thinking could be improved. Your analysis must specifically evaluate their performance on the same four dimensions: 1. **Root Cause Identification**: Did they mistake symptoms for root causes? (e.g., 'The cause you identified, 'lack of motivation,' might be a symptom. Consider exploring what is causing the lack of motivation.'). 2. **Assumption Surfacing**: Were their stated assumptions surface-level, or did they miss key underlying beliefs? (e.g., 'The assumption that 'more data will solve the problem' is common. Challenge yourself to ask what happens if that assumption is false. What if the problem isn't a lack of data, but a lack of consensus on what the data means?'). 3. **Self-Awareness (from Perpetuations)**: Did they struggle to identify how they might be contributing? If they listed hypothetical perpetuations but didn't acknowledge their own role, suggest they watch for these behaviors. (e.g., 'You identified several ways the problem could be perpetuated. As you implement your plan, it will be valuable to stay mindful of these potential pitfalls in your own behavior.'). If their input was vague, encourage deeper reflection. (e.g., 'Your reflection on perpetuation was brief. Consider spending more time thinking about how your own habits, even with good intentions, might be unintentionally sustaining the issue.'). 4. **Action Plan Quality**: Is their action plan vague or disconnected from the identified root causes? (e.g., 'Your action to 'work harder' is vague. A more effective action might be to 'block two hours each morning for focused work on Project X,' which directly addresses the root cause of fragmented attention.'). Select the 1-2 dimensions where the user has the most opportunity for growth and provide specific, actionable recommendations."
}
```

## 3. Frontend Changes: `frontend/src/app/session/[id]/page.tsx`

The frontend will be updated to reflect the new two-part feedback structure. This involves removing the "Validation" section from the UI.

The following code block will be deleted from the file:
```tsx
<div className="feedback-item">
  <h3>Validation</h3>
  <p>{summaryDownloader.summaryData.feedback.validation}</p>
</div>
```
This will leave only the "Strengths" and "Areas for Growth" sections, which will be populated by the new, more analytical AI-generated content.

## 4. Comprehensive Feedback Examples

The following examples illustrate the expected output from the newly prompted AI.

### Example 1: Strong Diagnosis, Weaker Action
*   **Strengths:**
    *   **Root Cause Identification:** You did an excellent job moving past the symptom of "too many meetings" to identify a more fundamental root cause: "no clear priorities set by leadership." This insight is crucial for finding a real solution instead of just managing a symptom.
    *   **Assumption Surfacing:** You successfully identified the powerful assumption that you must attend every meeting you're invited to. Recognizing this hidden belief is the first step to challenging it and reclaiming your time.
*   **Areas for Growth:**
    *   **Action Plan Quality:** Your action to "try to be more productive" is vague and disconnected from the root cause you identified. A more effective action would be to "draft a list of my top 3 proposed priorities and review them with my manager to get alignment," which directly addresses the problem of unclear priorities.
    *   **Self-Awareness (from Perpetuations):** You noted that "just working more hours to get everything done" would perpetuate the problem. It would be valuable to reflect on whether this is a pattern you're currently stuck in. Acknowledging if this is your default behavior is key to breaking the cycle of burnout.

### Example 2: Strong Action, Weaker Diagnosis
*   **Strengths:**
    *   **Action Plan Quality:** Your plan to "schedule one-on-one meetings with each team member this week to understand their perspective on the project's roadblocks" is an excellent, specific action. It's a constructive step that will help you gather more information directly from the source.
    *   **Self-Awareness (from Perpetuations):** You showed strong self-awareness by acknowledging that your default behavior is to "just take on all the critical work myself." Recognizing this tendency to jump into 'hero mode' is critical to building a more sustainable, team-based process.
*   **Areas for Growth:**
    *   **Root Cause Identification:** The cause you listed, "team members are not pulling their weight," may be a symptom. Your excellent action plan is actually the perfect tool to investigate the *true* root cause. Are they unclear on expectations? Are they blocked by something you don't see? Let the insights from your meetings help you refine your understanding of the real problem.
    *   **Assumption Surfacing:** Your plan seems to challenge your initial assumption that "they are just lazy." As you go into your meetings, consciously set that assumption aside and listen with genuine curiosity. This will allow you to diagnose the situation without bias.

### Example 3: A Balanced Session with Room for Refinement
*   **Strengths:**
    *   **Assumption Surfacing:** Identifying the belief that "good work should speak for itself" is a powerful insight. Many people share this assumption, and recognizing it opens the door to a more proactive strategy for career growth.
    *   **Self-Awareness (from Perpetuations):** You correctly identified that "keeping my head down and hoping to be noticed" is a passive way to perpetuate the situation, and you acknowledged this is your current approach. This ownership is the foundation for creating a new strategy.
*   **Areas for Growth:**
    *   **Action Plan Quality:** Your plan to "ask my boss for feedback" is a good start, but you can make it more effective by being more specific. Consider refining it to: "I will schedule a meeting with my boss and ask two specific questions: 1. 'What are the key criteria for promotion to the next level?' and 2. 'What are the top 1-2 areas where I need to demonstrate growth to be considered?'" This will yield more actionable information.
    *   **Root Cause Identification:** The cause "my boss doesn't see my value" is a good starting point. To get deeper, you could ask *why* they don't see your value. Is it a visibility issue (you don't communicate your wins)? Is it an alignment issue (the work you value isn't what the company values most right now)? Your more specific action plan will help you diagnose this deeper root cause.