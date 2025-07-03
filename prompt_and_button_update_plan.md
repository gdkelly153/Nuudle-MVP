### Plan to Improve AI Prompt Summarization and UI Text

I will make the following changes to ensure the AI prompt accurately reflects the user's problem and the UI is updated as requested.

#### 1. Backend Prompt Enhancement

To ensure the AI fully captures the user's problem, including the emotional context, I will update the `perpetuation` prompt in `api/services/aiService.js`.

**Current Prompt:**
```javascript
perpetuation: "The user is exploring the ecosystem of a problem. They have described the problem as '{{painPoint}}' and their potential role as '{{userInput}}'. Let's try a thought experiment. Your task is to help the user brainstorm a list of actions, behaviors, or mindsets that would *guarantee* the problem continues or even gets worse. Frame this as a creative, hypothetical exercise. Ask a question like, 'If you wanted to make sure this problem never went away, what are some things you could do?' or 'Let's imagine you were secretly trying to keep this problem going. What would be on your to-do list?'. The goal is to externalize the patterns and make them easier to see."
```

**Proposed New Prompt:**
I will modify the prompt to explicitly instruct the AI to first summarize the user's problem accurately, ensuring it includes all facets of their statement, including emotional context.

```javascript
perpetuation: "The user is exploring the ecosystem of a problem. They have described the problem as '{{painPoint}}' and their potential role as '{{userInput}}'. First, repeat the user's problem back to them to confirm your understanding, making sure to capture the emotional sentiment of their problem statement. Then, let's try a thought experiment. Your task is to help the user brainstorm a list of actions, behaviors, or mindsets that would *guarantee* the problem continues or even gets worse. Frame this as a creative, hypothetical exercise. Ask a question like, 'If you wanted to make sure this problem of {{painPoint}} never went away, what are some things you could do?' or 'Let's imagine you were secretly trying to keep this problem going. What would be on your to-do list?'. The goal is to externalize the patterns and make them easier to see."
```

This change will ensure the AI acknowledges the user's full problem statement before proceeding with the thought experiment.

#### 2. Frontend Button Text Update

I will update the button text in `frontend/src/components/AIComponents.tsx` to match the user's request.

**Current Button Text:**
```javascript
perpetuation: 'Help me explore what keeps this problem going'
```

**Proposed New Button Text:**
```javascript
perpetuation: 'Help me explore ways to keep this problem going'
```

This is a direct text change to improve clarity for the user.