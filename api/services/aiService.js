import Anthropic from '@anthropic-ai/sdk';
import dbService from './databaseService.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const systemPrompt = `You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to ask thoughtful, open-ended questions that encourage users to explore their own thinking, assumptions, and potential actions. You must not give direct advice, solutions, or tell users what to do.

Your tone should be supportive, encouraging, and genuinely curious. When users provide insightful or well-articulated ideas, acknowledge and validate their thinking with specific, personalized comments rather than generic praise. Always address the user as "you" and never refer to them as "the user."

After the very first response of a session, you MUST NOT refer to yourself, your role, or your purpose (e.g., "As an AI," "My goal is to," "I'm here to help you"). Your focus must be entirely on the user's content.

You will be given context in placeholders like {{placeholder}}. You must use the information inside these placeholders to inform your response, but you must NEVER include the placeholder syntax (e.g., '{{placeholder}}') in your final response.

CRITICAL RULE: When you reference any information provided by the user from a placeholder (e.g., {{painPoint}}, {{userInput}}, {{causes}}), you must NEVER summarize or rephrase it as an introductory sentence. Instead, incorporate your understanding of their input directly into your analytical bullet points. NEVER repeat the user's input verbatim or quote it directly. Always demonstrate that you understand their input by restating it in a fresh, concise way within your analysis.

You should format your responses using Markdown. Use paragraphs for separation and lists (numbered or bulleted) where appropriate. For bulleted lists, always use the standard markdown syntax with "- " (dash followed by space) at the beginning of each bullet point. Add extra line breaks after each bullet point to improve readability.`;


const prompts = {
  problem_articulation_direct: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. Ask 2-3 open-ended, clarifying questions to help you provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  problem_articulation_intervention: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. Start your response with 'Before we begin...' then ask 2-3 open-ended, clarifying questions to help you provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  problem_articulation_context_aware: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. CRITICAL: Do NOT summarize, repeat, or restate any information you have already provided. Do NOT include sections like 'What the problem is' or 'Where and when it occurs' - this adds no value. Instead, start directly with 'Let's explore a few questions to help contextualize the situation more completely:' Then ask 2-3 thoughtful, open-ended questions that focus ONLY on information that is genuinely missing or unclear from your description. Do NOT ask for information you have already provided. If you have provided sufficient context about the basic facts, ask deeper questions that help you reflect on nuances, patterns, or aspects you might not have considered. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  root_cause: {
    intros: [
      "Effective problem-solving means looking past symptoms to find the true drivers. Let's analyze the causes you've identified to trace them back to their origins.",
      "To find the right solutions, we must first understand the real problem. Let's examine the factors you've listed to uncover the underlying 'why'."
    ],
    headers: {
      intro: "### Uncovering the 'Why' Behind the 'What'",
      analysis: "### Examining Your Stated Causes",
      discovery: "### Exploring Unseen Connections",
      conclusion: "### Focusing on Foundational Drivers"
    },
    body: {
      analysis: "Context: Analyze these causes: '{{userInput}}'. For each cause, you MUST follow this two-step process in every bullet point: STEP 1: Start with a brief, conversational reference without bolding or colons (e.g., '- When you mention using alcohol as a psychological reward...'). STEP 2: MANDATORY evaluation - explicitly state whether this is a SYMPTOM or a ROOT CAUSE. If it's a symptom, explain why and suggest 1-2 deeper root causes. If it's a root cause, validate it and explain why it's foundational. Every bullet point must include this evaluation. Present as bullet points with NO introductory paragraph.",
      discovery: "Based on your problem and causes, ask 2-3 targeted questions to uncover foundational issues: What core needs aren't being met? What beliefs might be influencing this? What environmental factors are creating pressure? Use context: problem '{{painPoint}}', causes '{{causes}}'.",
      conclusion: "The goal of this analysis is to help you distinguish symptoms from true foundational drivers. Based on your inputs, consider if deeper needs—like a need for stress relief, acknowledgment, or focus—are the real drivers behind the causes you've listed. Your next crucial step is to use these insights to refine your list of contributing causes. By replacing symptoms with the deeper root causes we've uncovered, you can ensure your action plan targets the real problem, making your solutions far more effective."
    }
  },
  identify_assumptions: {
    intros: [
      "Great work identifying potential assumptions. Let's explore these beliefs together to understand how they might be influencing your situation.",
      "You've surfaced some interesting assumptions. Let's examine how these beliefs connect to your problem and what we can learn from testing them."
    ],
    headers: {
      intro: "### Surfacing Your Hidden Beliefs",
      analysis: "### Testing Your Assumptions",
      discovery: "### Uncovering Broader Assumptions",
      conclusion: "### Building on a Foundation of Truth"
    },
    body: {
      analysis: "Present your analysis as a markdown bulleted list, using '- ' for each point. CRITICAL: Do NOT repeat or quote the user's input verbatim. For each assumption from '{{userInput}}', weave a brief, conversational summary into your analysis without using bolding or colons. For example, instead of '**Viewing alcohol as deserved reward:** This assumption seems relevant...', write something like '- Your insight about viewing alcohol as a deserved reward is really valuable to explore. This belief might be influencing how you justify the habit to yourself.' Then evaluate if it's directly relevant to the cause '{{causes}}'. If relevant: Acknowledge the insight, then explore how this belief might be influencing the situation and suggest 1-2 specific ways to test it. If not relevant: Gently note the disconnect, then suggest 1-2 more relevant assumptions. Use collaborative, exploratory language.",
      discovery: "CRITICAL: Do NOT challenge the user's stated problem or causes. Your task is to infer potential HIDDEN beliefs that might be driving the situation. Based on the problem '{{painPoint}}' and causes '{{causes}}', identify 2-3 unstated assumptions the user might hold. For example, if a cause is 'I need to be perfect,' a hidden assumption might be 'I believe my worth is tied to my performance.' For each assumption, explain the reasoning and suggest a validation method.",
      conclusion: "Testing assumptions helps build self-awareness. Consider adding validation steps for relevant beliefs to your action plan."
    }
  },
  identify_assumptions_discovery: {
    intros: [
      "Let's uncover the hidden assumptions shaping your perspective. Identifying these beliefs is crucial for effective problem-solving.",
      "Your problem is filtered through assumptions about what's possible and true. Let's discover what beliefs might be influencing your thinking."
    ],
    headers: {
      intro: "### Discovering Your Hidden Assumptions",
      analysis: "### Analyzing Your Problem and Causes",
      discovery: "### Potential Assumptions to Consider",
      conclusion: "### Moving Forward with Greater Awareness"
    },
    body: {
      analysis: "CRITICAL: Do NOT challenge the user's stated problem or causes. Your task is to infer potential HIDDEN beliefs that might be driving the situation. Based on the problem '{{painPoint}}' and causes '{{causes}}', identify 2-3 unstated assumptions the user might hold. For example, if a cause is 'I need to be perfect,' a hidden assumption might be 'I believe my worth is tied to my performance.' For each, state the assumption and suggest a validation method.",
      discovery: "Common assumptions that influence problem-solving: You might assume you need more resources than necessary - test by starting with what you have. You might believe you must handle this alone - try reaching out to someone with relevant experience. You might think you need a perfect solution - experiment with a 'good enough' approach. You might assume change must be dramatic - try the smallest possible improvement.",
      conclusion: "Add validation steps for worthwhile beliefs to your action plan. This ensures your approach is evidence-based, not assumption-based."
    }
  },
  potential_actions: {
    intros: [
      "This is a thoughtful list of actions. Let's analyze how effectively they target the underlying drivers of the problem:",
      "Let's explore how your proposed actions connect to the root causes you've identified:",
      "Looking at your proposed actions, let's see how they measure up against the core issues we've uncovered:",
      "Let's dig into these potential solutions to see how well they address the foundational causes of the problem:"
    ],
    body: `{{dynamic_intro}}

Assume the role of a strategic coach. Your entire response MUST be a seamless, conversational narrative.

For each action from '{{userInput}}', you MUST generate a single, distinct bullet point. CRITICAL: You MUST NOT start any bullet point with a summary or bolded text. Instead, weave the user's idea directly into a flowing conversational sentence. Inside each bullet point, you MUST follow this logic:
1. **Intent Analysis:** First, check if the user has already stated a clear, root-cause-oriented intent for the action.
2. **Execute Logic:**
   - **IF INTENT IS CLEAR:** Validate their excellent thinking. You MUST weave a brief, conversational reference to the user's idea directly into your analysis as a single flowing sentence. For example, write something like "- Your idea to find alternative rewards is excellent because it directly addresses the psychological reward mechanism that's driving the habit..." Then elevate it by suggesting a concrete next step.
   - **IF INTENT IS UNCLEAR or SURFACE-LEVEL:** Explore the 'duality of intent'. You MUST weave a brief, conversational reference to the user's idea directly into your analysis as a single flowing sentence. For example, write something like "- When you mention practicing mindfulness techniques, if the goal is simply to distract yourself from cravings, this might provide temporary relief but..." Then explore the two potential intents (surface-level vs. root-cause from '{{causes}}') and conclude with a concrete, actionable suggestion.

After analyzing all actions, if you find a significant, unaddressed root cause from '{{causes}}', you MUST add a section with the header: ### Gap Analysis

Next, you MUST add a section with the header: ### Exploring Additional Opportunities
In this section, suggest 1-2 additional actions that would complement the user's existing plan.

Finally, you MUST add a section with the header: ### Committing to an Effective Plan
In this section, provide a concluding paragraph that summarizes the path forward.`
  },
  perpetuation: {
    intros: [
      "Understanding how we might unintentionally contribute to our problems builds self-awareness and reveals new paths forward.",
      "Let's examine your role in the system. Recognizing how our habits might maintain problems is the first step to changing them."
    ],
    headers: {
      intro: "### Examining Your Role in the System",
      analysis: "### Analyzing the Potential Impact",
      discovery: "### Exploring Other Contributing Actions",
      conclusion: "### Increasing Awareness of Your Potential Role"
    },
    body: {
      analysis: "Assume the role of a system analyst. Your task is to evaluate only the hypothetical actions provided in '{{userInput}}'. CRITICAL: You MUST generate one bullet point for EACH action provided by the user. Do NOT add any extra bullet points, summaries, or analyses that are not directly tied to one of the user's inputs. For each action, you must first evaluate if it would genuinely perpetuate the problem. IF IT WOULD: Explain the likely second-order consequence, showing how it would logically reinforce the existing problem cycle (e.g., 'this could lead to...'). IF IT WOULD NOT: Gently disagree and explain why that action is unlikely to reinforce the problem, and perhaps is even neutral or helpful. Maintain an exploratory and supportive tone. Present as bullet points without an introductory paragraph. Context: problem '{{painPoint}}'.",
      discovery: "Continue your role as a system analyst. In an exploratory tone, brainstorm 2-3 other plausible, hypothetical actions or mindsets that would also perpetuate the problem. Present these as bullet points without a leading introductory sentence.",
      conclusion: "If any patterns feel familiar, recognizing them is the first step to breaking the cycle. Watch for these dynamics as you implement your action plan."
    }
  },
  action_planning: {
    intros: [
      "Confidence comes from having a plan to deal with fears, not from having no fears. Let's turn your concerns into actionable strategies.",
      "By naming fears and creating mitigation plans, we can shrink anxieties to manageable size and act with greater confidence."
    ],
    headers: {
      intro: "### Turning Fear into Confident Action",
      analysis: "### Evaluating Your Fears and Plans",
      discovery: "### Building Confidence and Shifting Perspective",
      conclusion: "### Moving Forward with Clarity"
    },
    body: {
      analysis: "Present your analysis as a markdown bulleted list, using '- ' for each point, with NO introductory paragraph. For each fear and plan from '{{fears}}', weave a brief, conversational summary into your analysis without using bolding or colons. For example, instead of '**Social judgment for not drinking:** This fear seems realistic...', write something like '- Your concern about social judgment when you stop drinking is understandable and quite common. This fear seems realistic because...' Then evaluate if concerns are realistic and plans adequate. For well-founded fears with solid plans, validate and suggest strengthening steps. For exaggerated fears or weak plans, explain why and provide improvements.",
      discovery: "Strengthen confidence with targeted strategies: Find evidence contradicting worst-case scenarios. Make mitigation strategies specific with concrete actions. Identify overlooked strengths from past challenges. Create small tests before full commitment. Build your support network for advice and encouragement.",
      conclusion: "Confidence comes from preparation. Add specific preparation steps to your action plan to move forward with courage and wisdom."
    }
  },
  session_summary: "You worked through a problem described in '{{painPoint}}' with causes described in '{{causes}}', assumptions described in '{{assumptions}}', perpetuations described in '{{perpetuations}}', solutions described in '{{solutions}}', fears described in '{{fears}}', and selected action described in '{{actionPlan}}'.\n\n{{aiInteractionAnalysis}}\n\nProvide a comprehensive summary in JSON format. IMPORTANT: The tone of the summary should be personal and encouraging. Use 'you' and 'your' to refer to the user, and avoid using 'the user'.\n\nThe JSON structure should be as follows:\n\n{\n  \"title\": \"A concise, engaging title for this session\",\n  \"problem_overview\": \"A 2-3 sentence summary of your core problem\",\n  \"key_insights\": [\n    \"Insight 1: A specific observation about your problem or approach\",\n    \"Insight 2: Another meaningful insight from your analysis\",\n    \"Insight 3: A third insight if warranted\"\n  ],\n  \"action_plan\": {\n    \"primary_action\": \"The most important next step for you to take\",\n    \"supporting_actions\": [\n      \"Additional action 1\",\n      \"Additional action 2\"\n    ],\n    \"timeline\": \"Suggested timeframe for implementation\"\n  },\n  \"feedback\": {\n    \"strengths\": \"{{feedbackStrengths}}\",\n    \"areas_for_growth\": \"{{feedbackGrowth}}\"\n  },\n  \"conclusion\": \"An encouraging 2-3 sentence closing that empowers you to take action\"\n}\n\nReturn ONLY the JSON object, no additional text or formatting."
};

async function getClaudeResponse(prompt) {
  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  return {
    responseText: message.content[0].text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}


// Helper function to format context values for AI prompts
function formatContextValue(key, value) {
  if (!value) return '';
  
  switch (key) {
    case 'painPoint':
      return typeof value === 'string' ? value : '';
      
    case 'causes':
      if (Array.isArray(value)) {
        return value
          .filter(item => item && (typeof item === 'string' ? item.trim() : item.cause && item.cause.trim()))
          .map(item => typeof item === 'string' ? item : item.cause)
          .join(', ');
      }
      return '';
      
    case 'perpetuations':
      if (Array.isArray(value)) {
        return value
          .filter(item => item && (typeof item === 'string' ? item.trim() : item.text && item.text.trim()))
          .map(item => typeof item === 'string' ? item : item.text)
          .join(', ');
      }
      return '';
      
    case 'solutions':
      if (typeof value === 'object' && value !== null) {
        return Object.values(value)
          .filter(action => action && action.trim())
          .join(', ');
      }
      return '';
      
    case 'fears':
      if (typeof value === 'object' && value !== null) {
        return Object.values(value)
          .filter(fear => fear && (fear.name || fear.mitigation || fear.contingency))
          .map(fear => {
            const parts = [];
            if (fear.name) parts.push(`Fear: ${fear.name}`);
            if (fear.mitigation) parts.push(`Mitigation: ${fear.mitigation}`);
            if (fear.contingency) parts.push(`Contingency: ${fear.contingency}`);
            return parts.join('; ');
          })
          .join(' | ');
      }
      return '';
      
    default:
      // For any other keys, try to convert to a readable string
      if (typeof value === 'string') {
        return value;
      } else if (Array.isArray(value)) {
        return value.filter(item => item && item.toString().trim()).join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return Object.values(value).filter(item => item && item.toString().trim()).join(', ');
      }
      return value.toString();
  }
}

// Helper function to determine if user input for assumptions is empty or irrelevant
function isAssumptionInputEmptyOrIrrelevant(userInput, causes) {
  if (!userInput || userInput.trim() === '') {
    return true;
  }
  
  const trimmedInput = userInput.trim().toLowerCase();
  
  // Check for common phrases indicating the user doesn't know
  const unknownPhrases = [
    "i don't know",
    "i dont know",
    "not sure",
    "no idea",
    "don't know",
    "dont know",
    "unsure",
    "no assumptions",
    "none",
    "n/a",
    "na"
  ];
  
  if (unknownPhrases.some(phrase => trimmedInput.includes(phrase))) {
    return true;
  }
  
  // Check if input is too short or generic
  if (trimmedInput.length < 10) {
    return true;
  }
  
  // Check if input seems unrelated to the causes
  if (causes && Array.isArray(causes) && causes.length > 0) {
    const causesText = causes.map(c => typeof c === 'string' ? c : c.cause).join(' ').toLowerCase();
    const inputWords = trimmedInput.split(/\s+/);
    const causeWords = causesText.split(/\s+/);
    
    // If there's very little overlap between input and causes, it might be irrelevant
    const commonWords = inputWords.filter(word =>
      word.length > 3 && causeWords.some(causeWord =>
        causeWord.includes(word) || word.includes(causeWord)
      )
    );
    
    if (commonWords.length === 0 && inputWords.length > 2) {
      return true;
    }
  }
  
  return false;
}

// Helper function to analyze AI interactions and generate adaptive feedback
function analyzeAIInteractions(aiInteractionLog, sessionData) {
  if (!aiInteractionLog || aiInteractionLog.length === 0) {
    return {
      aiInteractionAnalysis: "No AI interactions were recorded during this session.",
      feedbackStrengths: "Provide a concise analysis of where the user's thinking was most effective. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and acknowledge their own role? 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs.",
      feedbackGrowth: "Provide specific, actionable recommendations for improvement. Your analysis must evaluate their performance on the same four dimensions and provide concrete next steps: 1. **Root Cause Identification**: If they mistook symptoms for root causes, explain why and suggest deeper causes to explore. 2. **Assumption Surfacing**: If their assumptions were surface-level, suggest specific deeper beliefs to examine. 3. **Self-Awareness (from Perpetuations)**: If they struggled to see their own role, provide specific behaviors to watch for. 4. **Action Plan Quality**: If their plan was vague, provide specific ways to make it more actionable. Select the 1-2 dimensions with the most opportunity for growth and provide specific, implementable recommendations."
    };
  }

  // Analyze each interaction to see if user incorporated AI feedback
  const interactionAnalysis = aiInteractionLog.map(interaction => {
    const stage = interaction.stage;
    const userInputBefore = interaction.userInputBefore;
    const aiResponse = interaction.aiResponse;
    
    return {
      stage,
      userInputBefore,
      aiResponse: aiResponse.substring(0, 200) + '...' // Truncate for analysis
    };
  });

  // Generate analysis text for the prompt
  const aiInteractionAnalysis = `AI Interaction Log Analysis: During this session, you received AI assistance on ${aiInteractionLog.length} occasion(s) across the following stages: ${aiInteractionLog.map(i => i.stage).join(', ')}. Use this information to provide adaptive feedback that recognizes whether the user incorporated AI suggestions effectively or missed valuable opportunities for improvement.`;

  // Generate adaptive feedback based on interaction patterns
  const feedbackStrengths = `Provide a concise analysis of where the user's thinking was most effective, taking into account their ${aiInteractionLog.length > 0 ? 'engagement with AI assistance' : 'independent work'}. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? ${aiInteractionLog.some(i => i.stage === 'root_cause') ? 'Consider how they responded to AI guidance on root causes.' : ''} 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? ${aiInteractionLog.some(i => i.stage === 'identify_assumptions') ? 'Consider how they engaged with AI assistance on assumptions.' : ''} 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and acknowledge their own role? ${aiInteractionLog.some(i => i.stage === 'perpetuation') ? 'Consider how they responded to AI guidance on perpetuation patterns.' : ''} 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? ${aiInteractionLog.some(i => i.stage === 'potential_actions' || i.stage === 'action_planning') ? 'Consider how they incorporated AI feedback on their action planning.' : ''} Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs.`;

  const feedbackGrowth = `Provide specific, actionable recommendations for improvement, considering their ${aiInteractionLog.length > 0 ? 'use of AI assistance' : 'independent approach'}. Your analysis must evaluate their performance on the same four dimensions and provide concrete next steps: 1. **Root Cause Identification**: If they mistook symptoms for root causes, explain why and suggest deeper causes to explore. ${aiInteractionLog.some(i => i.stage === 'root_cause') ? 'If they received AI guidance on root causes but didn\'t fully incorporate it, gently challenge them to revisit those insights.' : ''} 2. **Assumption Surfacing**: If their assumptions were surface-level, suggest specific deeper beliefs to examine. ${aiInteractionLog.some(i => i.stage === 'identify_assumptions') ? 'If they received AI help with assumptions but didn\'t act on it, encourage them to test those assumptions.' : ''} 3. **Self-Awareness (from Perpetuations)**: If they struggled to see their own role, provide specific behaviors to watch for. ${aiInteractionLog.some(i => i.stage === 'perpetuation') ? 'If they received AI insights about perpetuation patterns but didn\'t acknowledge their role, provide specific examples to watch for.' : ''} 4. **Action Plan Quality**: If their plan was vague, provide specific ways to make it more actionable. ${aiInteractionLog.some(i => i.stage === 'potential_actions' || i.stage === 'action_planning') ? 'If they received AI feedback on their actions but didn\'t refine them, suggest specific improvements.' : ''} Select the 1-2 dimensions with the most opportunity for growth and provide specific, implementable recommendations.`;

  return {
    aiInteractionAnalysis,
    feedbackStrengths,
    feedbackGrowth
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

  // Use user input directly without summarization
  const processedUserInput = userInput;
  
  let prompt = "";
  let actualStage = stage;
  
  // Special handling for identify_assumptions stage
  if (stage === 'identify_assumptions' && isAssumptionInputEmptyOrIrrelevant(userInput, sessionContext.causes)) {
    actualStage = 'identify_assumptions_discovery';
  }
  
  const promptConfig = prompts[actualStage];
  
  if (!promptConfig) {
    prompt = "";
  } else if (typeof promptConfig === 'string') {
    // Handle legacy string prompts
    prompt = promptConfig;
  } else if (promptConfig.body) {
    // Handle prompt structure based on body type
    let promptBody = '';
    
    if (typeof promptConfig.body === 'string') {
      // Unified prompt format - use body directly
      promptBody = promptConfig.body;
    } else if (typeof promptConfig.body === 'object' && promptConfig.headers) {
      // Legacy structured format with headers and sectioned body
      promptBody = `[INSTRUCTIONS_START]
You are an AI assistant named Nuudle. These are your specific instructions for this response:

SECTION 1 - Header: ${promptConfig.headers.analysis}
Instructions: ${promptConfig.body.analysis}

SECTION 2 - Header: ${promptConfig.headers.discovery}
Instructions: ${promptConfig.body.discovery}

SECTION 3 - Header: ${promptConfig.headers.conclusion}
Instructions: ${promptConfig.body.conclusion}

CRITICAL: Do not include any of the above instruction text in your response. Your response should be conversational and follow the instructions above. Start your response directly with the content for Section 1.
[INSTRUCTIONS_END]

Your conversational response begins now:`;
    } else {
      // Fallback for any other body structure
      promptBody = `Follow these instructions:

${promptConfig.body}`;
    }

    // Start with the prompt body
    prompt = promptBody;
    
    // Handle dynamic intro placeholder if it exists
    if (promptConfig.intros && promptConfig.intros.length > 0 && prompt.includes('{{dynamic_intro}}')) {
      const randomIntro = promptConfig.intros[Math.floor(Math.random() * promptConfig.intros.length)];
      prompt = prompt.replace(/\{\{dynamic_intro\}\}/g, randomIntro);
    }
  }
  
  // Use global regex replacement to replace ALL occurrences of each placeholder
  prompt = prompt.replace(/\{\{userInput\}\}/g, processedUserInput);
  Object.keys(sessionContext).forEach(key => {
    const formattedValue = formatContextValue(key, sessionContext[key]);
    // Escape special regex characters in the key and use global replacement
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    prompt = prompt.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), formattedValue);
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
      stage, // Keep original stage for logging consistency
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

export async function getSummary(userId, sessionId, sessionData, aiInteractionLog = []) {
  const limits = await dbService.checkRateLimits(userId, sessionId);
  if (!limits.dailyAllowed || !limits.sessionAllowed) {
    return {
      success: false,
      error: 'Rate limit reached.',
      fallback: "It looks like you've reached your AI usage limit for now. You can still review your session data.",
      usage: limits
    };
  }

  let prompt = prompts.session_summary;
  
  // Analyze AI interactions for adaptive feedback
  const analysisResult = analyzeAIInteractions(aiInteractionLog, sessionData);
  
  // Format session data for the prompt
  const formattedData = {
    painPoint: sessionData.pain_point || '',
    causes: Array.isArray(sessionData.causes) ? sessionData.causes.join(', ') : '',
    assumptions: Array.isArray(sessionData.assumptions) ? sessionData.assumptions.join(', ') : '',
    perpetuations: Array.isArray(sessionData.perpetuations) ? sessionData.perpetuations.join(', ') : '',
    solutions: Array.isArray(sessionData.solutions) ? sessionData.solutions.join(', ') : '',
    fears: Array.isArray(sessionData.fears) ? sessionData.fears.map(fear =>
      `Fear: ${fear.name}; Mitigation: ${fear.mitigation}; Contingency: ${fear.contingency}`
    ).join(' | ') : '',
    actionPlan: sessionData.action_plan || '',
    aiInteractionAnalysis: analysisResult.aiInteractionAnalysis,
    feedbackStrengths: analysisResult.feedbackStrengths,
    feedbackGrowth: analysisResult.feedbackGrowth
  };

  // Replace placeholders in prompt
  Object.keys(formattedData).forEach(key => {
    prompt = prompt.replace(`{{${key}}}`, formattedData[key]);
  });

  try {
    const aiResult = await getClaudeResponse(prompt);
    
    // Try to parse JSON from the response
    let summaryData;
    try {
      summaryData = JSON.parse(aiResult.responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return {
        success: false,
        error: 'Failed to generate structured summary',
        fallback: aiResult.responseText
      };
    }

    // Pricing for Claude 3 Haiku ($ per 1M tokens)
    const inputCost = (aiResult.inputTokens / 1000000) * 0.25;
    const outputCost = (aiResult.outputTokens / 1000000) * 1.25;
    const costUsd = inputCost + outputCost;

    const interactionId = await dbService.logAIInteraction({
      sessionId,
      userId,
      stage: 'session_summary',
      userInput: 'Session summary request',
      sessionContext: sessionData,
      aiResponse: aiResult.responseText,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      costUsd
    });

    return {
      success: true,
      interactionId,
      summary: summaryData,
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
      fallback: "Unable to generate AI summary at this time. You can still review your session data.",
      usage: limits
    };
  }
}
