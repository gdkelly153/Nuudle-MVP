import Anthropic from '@anthropic-ai/sdk';
import dbService from './databaseService.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const systemPrompt = `You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to act as a coach, not an advisor. You must not give direct advice, solutions, or tell the user what to do. Instead, you should ask clarifying, open-ended questions that encourage the user to explore their own thinking, assumptions, and potential actions. Your tone should be supportive, curious, and neutral. Frame your responses as questions or gentle reflections. For the 'root_cause' stage, you can suggest potential areas to consider, but frame them as possibilities, not definitive causes.`;

const prompts = {
  problem_articulation: "The user is starting to articulate their problem. Their initial input is: '{{userInput}}'. Ask 2-3 clarifying questions to help them deepen their understanding of the problem space.",
  root_cause: "The user has identified the following potential causes for their problem: '{{userInput}}'. Based on this, suggest 2-3 less obvious or systemic root causes they might be overlooking. Frame these as questions or possibilities.",
  assumptions: "The user is examining the assumption: '{{userInput}}'. Ask a question that helps them reflect on where this assumption comes from or how they might test its validity.",
  perpetuation: "The user is reflecting on how they might be perpetuating the problem with actions like: '{{userInput}}'. Ask a gentle, reflective question about this pattern or its impact.",
  action_planning: "The user is planning an action but has fears around it: '{{fears}}'. Ask a question that helps them process this fear and build confidence in their plan without minimizing their concern."
};

async function getClaudeResponse(prompt) {
  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  return {
    responseText: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

export async function getResponse(userId, sessionId, stage, userInput, sessionContext) {
  const limits = await dbService.checkRateLimits(userId, sessionId);
  if (!limits.dailyAllowed || !limits.sessionAllowed) {
    return {
      success: false,
      error: 'Rate limit reached.',
      fallback: "It looks like you've reached your AI usage limit for now. Continue with your own thinking—you've got this.",
      usage: limits
    };
  }

  let prompt = prompts[stage] || "";
  prompt = prompt.replace('{{userInput}}', userInput);
  Object.keys(sessionContext).forEach(key => {
    prompt = prompt.replace(`{{${key}}}`, JSON.stringify(sessionContext[key]));
  });

  try {
    const aiResult = await getClaudeResponse(prompt);
    
    // Pricing for Claude 3 Haiku ($ per 1M tokens)
    const inputCost = (aiResult.inputTokens / 1000000) * 0.25;
    const outputCost = (aiResult.outputTokens / 1000000) * 1.25;
    const costUsd = inputCost + outputCost;

    const interactionId = await dbService.logAIInteraction({
      sessionId,
      userId,
      stage,
      userInput,
      sessionContext,
      aiResponse: aiResult.responseText,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      costUsd
    });

    return {
      success: true,
      interactionId,
      response: aiResult.responseText,
      cost: costUsd,
      tokensUsed: aiResult.inputTokens + aiResult.outputTokens,
      usage: await dbService.checkRateLimits(userId, sessionId)
    };

  } catch (error) {
    console.error('Anthropic API error:', error);
    const errorMessage = error instanceof Anthropic.APIError ? error.message : 'The AI service is currently unavailable.';
    return {
      success: false,
      error: errorMessage,
      fallback: "It seems the AI is having a moment to itself. Please continue with your own thoughts for now.",
      usage: limits
    };
  }
}