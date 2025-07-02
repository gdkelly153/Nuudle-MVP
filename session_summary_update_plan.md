# Plan to Fix UI and AI Language

This plan will fix the translucent header in the Session Summary and update the AI's tone to be more personal.

## 1. Fix Translucent Header Color

The header in the session summary modal is hard to read in dark mode because the text is too dark for the background. This will be fixed by updating the CSS to make the header text white in dark mode.

*   **File to be Modified:** `frontend/src/app/globals.css`
*   **Change:** Add a CSS rule to the existing dark mode media query to specifically target the `h1` element inside the `.summary-header` and set its color to white.

```css
@media (prefers-color-scheme: dark) {
  /* ... other dark mode styles ... */

  .summary-header h1 {
    color: #FFFFFF;
  }
  
  /* ... */
}
```

## 2. Update AI Summary Language

The AI-generated summary currently refers to the user as "the user." To make it more personal, the prompt sent to the AI will be modified to instruct it to use "you" and "your" instead.

*   **File to be Modified:** `api/services/aiService.js`
*   **Change:** Update the `session_summary` prompt to include a clear instruction about the desired tone and update the JSON structure's descriptions to reinforce this.

The prompt will be changed to this:

```javascript
session_summary: "You worked through a problem described in '{{painPoint}}' with causes described in '{{causes}}', assumptions described in '{{assumptions}}', perpetuations described in '{{perpetuations}}', solutions described in '{{solutions}}', fears described in '{{fears}}', and selected action described in '{{actionPlan}}'.\n\nProvide a comprehensive summary in JSON format. IMPORTANT: The tone of the summary should be personal and encouraging. Use 'you' and 'your' to refer to the user, and avoid using 'the user'.\n\nThe JSON structure should be as follows:\n\n{\n  \"title\": \"A concise, engaging title for this session\",\n  \"problem_overview\": \"A 2-3 sentence summary of your core problem\",\n  \"key_insights\": [\n    \"Insight 1: A specific observation about your problem or approach\",\n    \"Insight 2: Another meaningful insight from your analysis\",\n    \"Insight 3: A third insight if warranted\"\n  ],\n  \"action_plan\": {\n    \"primary_action\": \"The most important next step for you to take\",\n    \"supporting_actions\": [\n      \"Additional action 1\",\n      \"Additional action 2\"\n    ],\n    \"timeline\": \"Suggested timeframe for implementation\"\n  },\n  \"feedback\": {\n    \"strengths\": \"What you did well in your analysis\",\n    \"areas_for_growth\": \"Gentle suggestions for your improvement\",\n    \"validation\": \"Encouragement about your chosen approach\"\n  },\n  \"conclusion\": \"An encouraging 2-3 sentence closing that empowers you to take action\"\n}\n\nReturn ONLY the JSON object, no additional text or formatting."