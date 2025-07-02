# AI Prompt Update Plan

## Objective

To improve the user experience when a user clicks "Help me identify assumptions" without having provided any assumptions. The current prompt is verbose and uses clinical language. The goal is to make the prompt more direct and collaborative.

## Analysis

The relevant logic is in `api/services/aiService.js`, specifically within the `identify_assumptions_discovery` prompt configuration.

### Current Implementation

The `body.analysis` for `identify_assumptions_discovery` is:
```javascript
"You are working on a problem described in '{{painPoint}}' and have identified contributing causes described in '{{causes}}'. Begin your response with a single sentence that summarizes your problem and causes. Then help you uncover potential assumptions that might be influencing your thinking.\n\nBased on your analysis, here are some assumptions you might be making that would be worth examining:\n\n- [Assumption 1 based on the problem and causes, with a question to help validate it]\n\n- [Assumption 2 based on the problem and causes, with a question to help validate it]\n\n- [Assumption 3 based on the problem and causes, with a question to help validate it]"
```

## Proposed Changes

1.  **Remove Redundant Summary:** Eliminate the first sentence that summarizes the problem and causes.
2.  **Update Phrasing:** Change "Based on your analysis" to "Based on what you've shared".

### New Implementation

The updated `body.analysis` will be:
```javascript
"Based on what you've shared, here are some assumptions you might be making that would be worth examining:\n\n- [Assumption 1 based on the problem and causes, with a question to help validate it]\n\n- [Assumption 2 based on the problem and causes, with a question to help validate it]\n\n- [Assumption 3 based on the problem and causes, with a question to help validate it]"
```

## Plan Diagram

```mermaid
graph TD
    A[Start] --> B{User asks to identify assumptions with no input};
    B --> C{Current Logic: Triggers `identify_assumptions_discovery` prompt};
    C --> D[Current Prompt: Includes summary and 'analysis' phrasing];
    D --> E{Proposed Change};
    E --> F[Remove summary sentence];
    E --> G[Change 'analysis' to 'what you've shared'];
    F & G --> H[New `identify_assumptions_discovery` prompt];
    H --> I[Implement change in `api/services/aiService.js`];
    I --> J[End];