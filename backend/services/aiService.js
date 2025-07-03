export function getAssistance(stage, context) {
  console.log(`Getting assistance for stage: ${stage}`);
  
  const questions = {
    problem_articulation: "What is the underlying assumption you're making about this problem?",
    root_cause: "If you were to solve this problem overnight, what would be the first thing you would do?",
    assumptions: "What evidence do you have to support that assumption?",
    action_planning: "What's a small, concrete step you could take in the next 24 hours?"
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        question: questions[stage] || "Tell me more about that.",
        tokens_used: 10 // Mock token usage
      });
    }, 500);
  });
}