import Anthropic from '@anthropic-ai/sdk';
import dbService from './databaseService.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const systemPrompt = `You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to ask thoughtful, open-ended questions that encourage users to explore their own thinking, assumptions, and potential actions. You must not give direct advice, solutions, or tell users what to do.

Your tone should be supportive, encouraging, and genuinely curious. When users provide insightful or well-articulated ideas, acknowledge and validate their thinking with specific, personalized comments rather than generic praise. Always address the user as "you" and never refer to them as "the user."

Only mention your core purpose (asking questions rather than giving advice) in the very first response of a session - do not repeat this explanation in subsequent responses.

You will be given context in placeholders like {{placeholder}}. You must use the information inside these placeholders to inform your response, but you must NEVER include the placeholder syntax (e.g., '{{placeholder}}') in your final response.

CRITICAL RULE: When you reference any information provided by the user from a placeholder (e.g., {{painPoint}}, {{userInput}}, {{causes}}), you must NEVER summarize or rephrase it as an introductory sentence. Instead, incorporate your understanding of their input directly into your analytical bullet points. NEVER repeat the user's input verbatim or quote it directly. Always demonstrate that you understand their input by restating it in a fresh, concise way within your analysis.

You should format your responses using Markdown. Use paragraphs for separation and lists (numbered or bulleted) where appropriate. For bulleted lists, always use the standard markdown syntax with "- " (dash followed by space) at the beginning of each bullet point. Add extra line breaks after each bullet point to improve readability.`;

// Dynamic introductory sentences for analysis and discovery sections
const dynamicIntros = {
  root_cause: {
    analysis: [
      "Let's take a closer look at these stated causes:",
      "Here's an analysis of the potential reasons you've mentioned:",
      "Examining the causes you've described, here's what stands out:",
      "Let's break down the contributing factors you've identified:"
    ],
    discovery: [
      "Let's explore what additional factors might be contributing:",
      "Now, let's think about other causes that could be at play:",
      "What underlying influences might we be overlooking? Let's investigate:",
      "Let's dig a bit deeper to uncover any hidden drivers:"
    ]
  },
  identify_assumptions: {
    analysis: [
      "Let's test the assumptions you've identified to see how solid they are:",
      "Here's an analysis of your stated beliefs. Let's see if they hold up to scrutiny:",
      "You've surfaced some potential assumptions. Let's examine them more closely:",
      "Let's evaluate whether these assumptions are well-founded:"
    ],
    discovery: [
      "What other hidden beliefs might be influencing your perspective? Let's explore:",
      "Now, let's try to uncover any assumptions that might be lurking beneath the surface:",
      "Beyond what you've listed, what else might you be taking for granted?",
      "Let's consider what other beliefs could be shaping your approach:"
    ]
  },
  identify_assumptions_discovery: {
    analysis: [
      "Based on your problem and causes, let's identify some assumptions you might be making:",
      "Let's analyze your situation to surface potential beliefs that could be influencing your thinking:",
      "Here are some assumptions that might be worth examining in your case:",
      "Let's explore what you might be taking for granted about this situation:"
    ],
    discovery: [
      "What broader assumptions might be at play? Let's consider some common patterns:",
      "Beyond these specific beliefs, let's explore other areas where assumptions often hide:",
      "Let's think about what else you might be assuming without realizing it:",
      "What other hidden beliefs could be influencing how you see this problem?"
    ]
  },
  potential_actions: {
    analysis: [
      "Let's evaluate these potential actions you've outlined:",
      "Here's a look at the steps you're considering and how they might work:",
      "Let's analyze your drafted actions to see how well they address the root causes:",
      "Here's an assessment of the approaches you've proposed:"
    ],
    discovery: [
      "What other creative solutions could we explore?",
      "Let's brainstorm some alternative approaches you might not have considered:",
      "What additional strategies might be worth exploring?",
      "Let's think about other possible paths forward:"
    ]
  },
  perpetuation: {
    analysis: [
      "Let's analyze how effectively these hypothetical actions could perpetuate the problem:",
      "Here's an evaluation of the potential impact these actions might have on maintaining the situation:",
      "Let's examine how well these approaches could work to keep the problem in place:",
      "Here's an assessment of the strategic value these actions would have in sustaining the issue:"
    ],
    discovery: [
      "Let's expand this thought experiment with additional hypothetical scenarios:",
      "What other actions could someone take if their goal was to ensure this problem continues?",
      "Let's brainstorm more ways this situation could be maintained, whether actively or passively:",
      "What additional strategies might be effective at keeping this problem unchanged?"
    ]
  },
  action_planning: {
    analysis: [
      "Let's examine the fears and mitigation plans you've outlined:",
      "Here's an analysis of your concerns and the strategies you've developed to address them:",
      "Let's evaluate whether your fears are realistic and your plans are adequate:",
      "Let's take a closer look at what you're worried about and how you plan to handle it:"
    ],
    discovery: [
      "What might help build your confidence and strengthen your approach?",
      "Let's explore ways to reality-test your concerns and bolster your readiness:",
      "What resources or perspectives might you be overlooking?",
      "Let's consider what else could help you move forward with greater certainty:"
    ]
  }
};

// Helper function to get a random introductory sentence
function getRandomIntro(stage, section) {
  const stageIntros = dynamicIntros[stage];
  if (!stageIntros || !stageIntros[section]) {
    return '';
  }
  
  const intros = stageIntros[section];
  const randomIndex = Math.floor(Math.random() * intros.length);
  return intros[randomIndex];
}

const prompts = {
  problem_articulation_direct: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. Ask 2-3 open-ended, clarifying questions to help you provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  problem_articulation_intervention: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. Start your response with 'Before we begin...' then ask 2-3 open-ended, clarifying questions to help you provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  problem_articulation_context_aware: "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. CRITICAL: Do NOT summarize, repeat, or restate any information you have already provided. Do NOT include sections like 'What the problem is' or 'Where and when it occurs' - this adds no value. Instead, start directly with a brief transitional phrase like 'Based on what you've shared, let's explore a few questions to help contextualize the situation more completely:' Then ask 2-3 thoughtful, open-ended questions that focus ONLY on information that is genuinely missing or unclear from your description. Do NOT ask for information you have already provided. If you have provided sufficient context about the basic facts, ask deeper questions that help you reflect on nuances, patterns, or aspects you might not have considered. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
  root_cause: {
    intros: [
      "To solve a problem effectively, it's helpful to distinguish between its symptoms and its root causes. This is the essence of first-principles thinking: breaking an issue down to its most fundamental parts to understand what's truly driving it.",
      "Getting to the heart of a problem means looking past the surface-level issues to find the true drivers. Let's explore the potential causes you've identified and see if we can trace them back to their origins.",
      "Let's dig a bit deeper into what might be causing this situation. Often, what we first see as the problem is actually a symptom of something deeper. By examining the cause-and-effect relationships, we can get closer to the real issue.",
      "A clear understanding of the root causes of a problem is the most important step toward solving it. This process is about moving from the 'what' to the 'why' so we can be confident in our approach.",
      "It's easy to get caught up in the immediate challenges of a problem. Let's take a step back and analyze the underlying factors you've identified to ensure we're aiming at the right targets."
    ],
    headers: {
      intro: "### Uncovering the 'Why' Behind the 'What'",
      analysis: "### Examining Your Stated Causes",
      discovery: "### Exploring Unseen Connections",
      conclusion: "### Focusing on Foundational Drivers"
    },
    body: {
      analysis: "Analyze your stated causes: '{{userInput}}'. For each of the contributing causes, evaluate whether it appears to be a genuine root cause or merely a symptom. If a cause seems like a genuine root cause, briefly validate it (e.g., 'That sounds like a significant underlying factor.'). However, if a cause appears to be more of a symptom, challenge you to think deeper with questions like 'Is this the root cause, or could it be a symptom of something else?' or 'What might be causing this cause?' Present your analysis and questions in bullet points, with one bullet point for each cause you provided.",
      discovery: "Sometimes the most important causes are the ones we haven't considered yet. Let's explore some additional angles that might reveal specific factors you may have overlooked that are directly related to your situation. Consider practical elements like timing, resources, skills, relationships, or environmental factors that could be contributing to your problem. Ask 2-3 specific discovery questions in bullet points that are tailored to your particular situation.",
      conclusion: "The goal of this analysis is to get to foundational, underlying root causes. If this analysis has helped reveal deeper factors, updating your list of causes will help focus your efforts on what's truly driving the situation."
    }
  },
  identify_assumptions: {
    intros: [
      "Our minds use assumptions as shortcuts to make sense of the world, but these are often shaped by our unique experiences and biases. That's why it's so important to test our assumptions—to separate what we think we know from what is actually true.",
      "Every decision we make is based on a set of assumptions. By bringing these to the surface and examining them, we can ensure our thinking is grounded in reality, not just perception.",
      "Let's take a moment to consider the beliefs that might be influencing your perspective on this problem. Unexamined assumptions can lead us down the wrong path, so validating them is a crucial step.",
      "The assumptions we hold can be so ingrained that we don't even notice them. This step is about shining a light on those hidden beliefs to make sure they're not distorting our view of the problem.",
      "Before we move forward, it's wise to check our foundation. Let's explore the assumptions you're making to ensure they're solid and not just based on habit or incomplete information."
    ],
    headers: {
      intro: "### Surfacing Your Hidden Beliefs",
      analysis: "### Testing Your Assumptions",
      discovery: "### Uncovering Broader Assumptions",
      conclusion: "### Building on a Foundation of Truth"
    },
    body: {
      analysis: "Analyze your provided assumptions: '{{userInput}}'. For each assumption, evaluate whether it seems reasonable and well-supported or weak and unsupported. If an assumption appears reasonable, briefly validate it (e.g., 'That's a reasonable assumption given the circumstances.'). However, if an assumption seems weak or unsupported, challenge it by asking for evidence or exploring alternatives (e.g., 'What evidence supports this assumption?' or 'What would happen if the opposite were true?'). Present your analysis and questions in bullet points, with one bullet point for each assumption you provided.",
      discovery: "Let's broaden our search for hidden beliefs. First, considering your problem ('{{painPoint}}') and its causes ('{{causes}}'), identify 1-2 potential assumptions that seem directly related to your situation. Then, suggest 1-2 broader, more universal assumptions that often come up in similar contexts. For each, state the potential assumption plainly, then ask a question to help validate it. Do not use labels like 'Assumption:' or 'Question:'. Instead, present the assumption and question together in a natural, conversational way within a single bullet point. For example: 'You might be assuming that success requires working 80 hours a week. What if you could achieve your goals with a more balanced approach?' Present these as a single bulleted list.",
      conclusion: "To build a solid foundation for your thinking, it's crucial to test your assumptions. If this reflection has clarified your perspective, revising your stated assumptions will ensure your approach is grounded in reality."
    }
  },
  identify_assumptions_discovery: {
    intros: [
      "Let's explore the assumptions that might be shaping your perspective on this problem. Sometimes we hold beliefs so naturally that we don't even recognize them as assumptions—but identifying them is crucial for effective problem-solving.",
      "Every problem we face is filtered through our assumptions about how things work, what's possible, and what's true. Let's uncover some of the beliefs that might be influencing your thinking about this situation.",
      "The assumptions we make can either help or hinder our problem-solving. Since you haven't identified specific assumptions yet, let's work together to discover what beliefs might be underlying your analysis.",
      "Our minds naturally fill in gaps with assumptions, often without us realizing it. Let's examine your problem and contributing causes to identify what you might be taking for granted.",
      "Before we can validate our thinking, we need to surface the assumptions we're making. Let's analyze your situation to identify the beliefs that might be shaping your perspective."
    ],
    headers: {
      intro: "### Discovering Your Hidden Assumptions",
      analysis: "### Analyzing Your Problem and Causes",
      discovery: "### Potential Assumptions to Consider",
      conclusion: "### Moving Forward with Greater Awareness"
    },
    body: {
      analysis: "Context: You are working on a problem described in '{{painPoint}}' and have identified contributing causes described in '{{causes}}'. Based on what you've shared, identify 3-4 potential assumptions you might be making that would be worth examining. For each, state the potential assumption plainly, then ask a question to help validate it. Do not use labels like 'Assumption:' or 'Question:'. Instead, present the assumption and question together in a natural, conversational way within a single bullet point. For example: 'It appears you believe that you need to have a complete plan before starting. What's the smallest step you could take to begin learning?' Present these in bullet points.",
      discovery: "Beyond these specific assumptions, there are some broader categories of beliefs that often influence how we approach problems. Consider whether any of these might apply to your situation:\n\n- What are you assuming about the resources, time, or support available to address this problem?\n\n- What beliefs do you hold about your own capabilities or limitations in this situation?\n\n- What assumptions are you making about other people's motivations, knowledge, or willingness to help?\n\n- What do you take for granted about how this type of problem typically gets resolved?",
      conclusion: "Identifying the assumptions that shape your approach is a key step in this process. As potential beliefs are uncovered, adding any that resonate to your list will create a more complete picture of what's influencing your thinking."
    }
  },
  potential_actions: {
    intros: [
      "The most effective actions are usually those that address a problem's root causes. As we plan, it's also wise to think about the potential effects of our actions on ourselves and others.",
      "Now that we have a clearer understanding of the problem, let's brainstorm some potential actions. The goal here is to think broadly at first, considering different strategies and their possible outcomes.",
      "This is where we transition from thinking to doing. Let's explore some concrete steps you could take to address the root causes we've uncovered, keeping in mind the potential impact of each.",
      "A good plan of action is one that is both effective and thoughtful. Let's consider the actions you've drafted and also explore other possibilities that might not be immediately obvious.",
      "Let's think about the future. What actions could you take that would not only solve the immediate problem but also set you up for success down the road? We'll consider both direct solutions and their wider implications."
    ],
    headers: {
      intro: "### Charting Your Course from Insight to Action",
      analysis: "### Refining Your Drafted Actions",
      discovery: "### Brainstorming Alternative Paths",
      conclusion: "### Committing to an Effective Plan"
    },
    body: {
      analysis: "Context: You are working on a problem described in '{{painPoint}}', with causes described in '{{causes}}' and perpetuations described in '{{perpetuations}}'. Analyze your drafted actions: '{{userInput}}'. For each action listed, evaluate whether it appears to effectively address the root causes or seems incomplete/misdirected. If an action seems well-targeted and feasible, briefly validate it (e.g., 'That action directly addresses the core issue.'). However, if an action seems superficial, unrealistic, or misaligned with the root causes, challenge you with questions like 'How does this action address the root cause?' or 'What obstacles might prevent this from working?' Present your analysis and questions in bullet points, with one bullet point for each action you provided.",
      discovery: "While your drafted actions provide a foundation, there may be additional approaches worth considering that could complement or enhance your current plan. Let's explore some alternative strategies that might address different aspects of your situation. Ask 2-3 specific discovery questions in bullet points that help you consider alternative approaches tailored to your situation.",
      conclusion: "To build an effective plan, it's helpful to think through multiple actions. If these perspectives introduce new possibilities, consider refining your action plan to create the best path forward."
    }
  },
  perpetuation: {
    intros: [
      "Sometimes, without realizing it, our own behaviors can contribute to the problems we're trying to solve. Reflecting on this isn't about blame; it's about gaining self-awareness to spot potential blind spots or patterns we might not consciously perceive.",
      "It can be difficult to see our own role in a challenging situation, but it's a powerful step toward making meaningful change. Let's explore how your actions might be influencing the problem, even in subtle ways.",
      "This step is about looking in the mirror with curiosity and honesty. By understanding how we might be unintentionally perpetuating a problem, we can unlock new ways to move forward.",
      "Let's consider the system around this problem and your role within it. Sometimes, even with the best intentions, our habits can keep a problem in place. Recognizing these patterns is the first step to changing them.",
      "This is a chance to reflect on the subtle patterns and behaviors that might be at play. The goal isn't to find fault, but to empower you with a more complete understanding of the situation."
    ],
    headers: {
      intro: "### Examining Your Role in the System",
      analysis: "### Analyzing the Potential Impact",
      discovery: "### Exploring Other Contributing Actions",
      conclusion: "### Increasing Awareness of Your Potential Role"
    },
    body: {
      analysis: "Context: You are engaging in a thought experiment about how a problem described in '{{painPoint}}' could be perpetuated. Analyze the hypothetical actions you've listed in '{{userInput}}'. For each action, evaluate its potential effectiveness in maintaining or worsening the problem. Frame your analysis from a neutral, strategic perspective. For instance, you might say, 'This action could effectively perpetuate the issue by...' or 'The strategic value of this approach in maintaining the problem would be...' Avoid language that implies you are currently performing these actions. Present your analysis in bullet points, with one bullet point for each hypothetical action you provided.",
      discovery: "Now, let's expand this thought experiment. To uncover other ways this problem could be sustained, let's brainstorm some additional hypothetical scenarios. Ask 2-3 discovery questions to explore other actions or mindsets that someone might adopt if their goal was to ensure the problem continues. For example: 'What is one thing someone could *stop* doing that would guarantee the problem remains?' or 'What belief could someone hold that would make them passively accept the situation as unchangeable?' Focus on expanding the strategic understanding of how problems can be maintained.",
      conclusion: "This thought experiment is designed to increase your awareness of how certain actions—whether active or passive—could play a role in the problem's continuation. Understanding these dynamics is not about assigning blame, but about empowering you with a clearer view of the system, which is the first step toward influencing it effectively."
    }
  },
  action_planning: {
    intros: [
      "Fear is one of the most powerful forces shaping the decisions we make and the situations we avoid. By naming our fears and creating plans to address them, we can often find they are not as daunting as they first appeared, allowing us to act with greater confidence.",
      "Let's confront the concerns that might be holding you back. Thinking through our fears, planning how to mitigate them, and having a backup plan can shrink them down to a manageable size and ensure we're moving forward for the right reasons.",
      "The path to meaningful action often runs through our fears. This step is about turning those anxieties into a concrete plan. By identifying what you're afraid of and preparing for it, you can build the confidence to take the right steps.",
      "Avoiding a decision is still a decision, and it's often one driven by fear. Let's bring those fears into the light. By creating mitigation and contingency plans, we can take back control and choose our actions with clarity and purpose.",
      "Confidence doesn't come from having no fears; it comes from having a plan to deal with them. Let's walk through your concerns, build strategies to manage them, and pave the way for you to act effectively and with conviction."
    ],
    headers: {
      intro: "### Turning Fear into Confident Action",
      analysis: "### Evaluating Your Fears and Plans",
      discovery: "### Building Confidence and Shifting Perspective",
      conclusion: "### Moving Forward with Clarity"
    },
    body: {
      analysis: "Analyze your provided fears and plans: '{{fears}}'. For each fear and mitigation plan provided, evaluate whether your concerns seem realistic and your plans seem adequate. If a fear appears well-founded and your plan seems solid, validate your approach (e.g., 'That's a reasonable concern and your mitigation plan addresses it well.'). However, if your fears seem exaggerated or your plans seem inadequate, challenge you with questions like 'Is this fear based on evidence or assumption?' or 'How specifically will this plan address your concern?' Present your analysis and questions in bullet points, with one bullet point for each fear and plan you provided.",
      discovery: "Moving from concern to action often requires shifting our perspective and recognizing strengths we may have overlooked. Let's explore ways to build your confidence and reality-test your concerns so you can move forward with greater certainty.\n\n- What evidence do you have that contradicts your fears?\n\n- How well do your mitigation strategies address the root of each concern?\n\n- Are your contingency plans realistic and actionable?\n\n- What skills, resources, or support systems do you have that you might be overlooking?\n\n- How might you reframe these fears as challenges or growth opportunities?",
      conclusion: "A confident plan is built by thinking through potential fears. If these strategies seem helpful, incorporating them into your action plan can create a more robust path forward."
    }
  },
  session_summary: "You worked through a problem described in '{{painPoint}}' with causes described in '{{causes}}', assumptions described in '{{assumptions}}', perpetuations described in '{{perpetuations}}', solutions described in '{{solutions}}', fears described in '{{fears}}', and selected action described in '{{actionPlan}}'.\n\nProvide a comprehensive summary in JSON format. IMPORTANT: The tone of the summary should be personal and encouraging. Use 'you' and 'your' to refer to the user, and avoid using 'the user'.\n\nThe JSON structure should be as follows:\n\n{\n  \"title\": \"A concise, engaging title for this session\",\n  \"problem_overview\": \"A 2-3 sentence summary of your core problem\",\n  \"key_insights\": [\n    \"Insight 1: A specific observation about your problem or approach\",\n    \"Insight 2: Another meaningful insight from your analysis\",\n    \"Insight 3: A third insight if warranted\"\n  ],\n  \"action_plan\": {\n    \"primary_action\": \"The most important next step for you to take\",\n    \"supporting_actions\": [\n      \"Additional action 1\",\n      \"Additional action 2\"\n    ],\n    \"timeline\": \"Suggested timeframe for implementation\"\n  },\n  \"feedback\": {\n    \"strengths\": \"Provide a concise analysis of where the user's thinking was most effective. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? (e.g., 'You effectively identified that the team's missed deadlines were not just a time management issue, but a symptom of unclear project requirements.'). 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? (e.g., 'You successfully surfaced the hidden assumption that asking for help is a sign of weakness, which was limiting your options.'). 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and, crucially, acknowledge their own role in any of them? (e.g., 'You showed strong self-awareness by not only identifying 'procrastinating on difficult feedback' as a way to perpetuate the problem but also acknowledging this is a current behavior you need to address.'). 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? (e.g., 'Your action plan to 'schedule a kickoff meeting to define requirements' is a concrete step that directly addresses the root cause you identified.'). Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs.\",\n    \"areas_for_growth\": \"Provide a concise, constructive analysis of where the user's thinking could be improved. Your analysis must specifically evaluate their performance on the same four dimensions: 1. **Root Cause Identification**: Did they mistake symptoms for root causes? (e.g., 'The cause you identified, 'lack of motivation,' might be a symptom. Consider exploring what is causing the lack of motivation.'). 2. **Assumption Surfacing**: Were their stated assumptions surface-level, or did they miss key underlying beliefs? (e.g., 'The assumption that 'more data will solve the problem' is common. Challenge yourself to ask what happens if that assumption is false. What if the problem isn't a lack of data, but a lack of consensus on what the data means?'). 3. **Self-Awareness (from Perpetuations)**: Did they struggle to identify how they might be contributing? If they listed hypothetical perpetuations but didn't acknowledge their own role, suggest they watch for these behaviors. (e.g., 'You identified several ways the problem could be perpetuated. As you implement your plan, it will be valuable to stay mindful of these potential pitfalls in your own behavior.'). If their input was vague, encourage deeper reflection. (e.g., 'Your reflection on perpetuation was brief. Consider spending more time thinking about how your own habits, even with good intentions, might be unintentionally sustaining the issue.'). 4. **Action Plan Quality**: Is their action plan vague or disconnected from the identified root causes? (e.g., 'Your action to 'work harder' is vague. A more effective action might be to 'block two hours each morning for focused work on Project X,' which directly addresses the root cause of fragmented attention.'). Select the 1-2 dimensions where the user has the most opportunity for growth and provide specific, actionable recommendations.\"\n  },\n  \"conclusion\": \"An encouraging 2-3 sentence closing that empowers you to take action\"\n}\n\nReturn ONLY the JSON object, no additional text or formatting."
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
  } else if (promptConfig.intros && promptConfig.body) {
    // Handle new dynamic prompt structure with headers
    
    if (promptConfig.headers && typeof promptConfig.body === 'object') {
      // New structured format with headers and sectioned body - remove intro section
      const analysisIntro = getRandomIntro(actualStage, 'analysis');
      const discoveryIntro = getRandomIntro(actualStage, 'discovery');
      
      prompt = `Start your response with the following section and header:

${promptConfig.headers.analysis}

${analysisIntro}

${promptConfig.body.analysis}

Then continue with the following sections, each preceded by its respective header:

${promptConfig.headers.discovery}

${discoveryIntro}

${promptConfig.body.discovery}

${promptConfig.headers.conclusion}

${promptConfig.body.conclusion}`;
    } else {
      // Legacy format - handle old structure for backward compatibility
      prompt = `Follow these instructions:

${promptConfig.body}`;
    }
  }
  
  prompt = prompt.replace('{{userInput}}', processedUserInput);
  Object.keys(sessionContext).forEach(key => {
    const formattedValue = formatContextValue(key, sessionContext[key]);
    prompt = prompt.replace(`{{${key}}}`, formattedValue);
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

export async function getSummary(userId, sessionId, sessionData) {
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
    actionPlan: sessionData.action_plan || ''
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
