import Anthropic from '@anthropic-ai/sdk';
import dbService from './databaseService.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const systemPrompt = `You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to act as a coach, not an advisor. You must not give direct advice, solutions, or tell the user what to do. Instead, you should ask clarifying, open-ended questions that encourage the user to explore their own thinking, assumptions, and potential actions. Your tone should be supportive, curious, and neutral. Frame your responses as questions or gentle reflections. For the 'root_cause' stage, you can suggest potential areas to consider, but frame them as possibilities, not definitive causes.

You should format your responses using Markdown. Use paragraphs for separation and lists (numbered or bulleted) where appropriate to make the text more readable.`;

const prompts = {
  problem_articulation: "The user is articulating a problem. Their initial statement is: '{{userInput}}'. Your task is ONLY to help them describe their situation more completely. Do NOT suggest any causal factors or root causes. Ask 2-3 open-ended, clarifying questions to help them provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'.",
  root_cause: "The user has identified the following potential causes for their problem: '{{userInput}}'. Based on this, suggest 2-3 less obvious or systemic root causes they might be overlooking. Frame these as questions or possibilities.",
  identify_assumptions: "The user has listed these potential causes: '{{userInput}}'. For each cause, ask a question that helps the user identify a potential hidden assumption they might be making. Focus on helping them question the certainty of their own statements.",
  suggest_causes: "The user is working on this problem: '{{painPoint}}' and has identified these initial causes: '{{causes}}'. Suggest 2-3 additional, distinct, and actionable root causes they may not have considered. Present these as a simple list.",
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