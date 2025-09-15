import os
import json
import random
from typing import Dict, List, Optional, Any
from anthropic import Anthropic
from datetime import datetime
# Import database functions - hybrid import for local/production compatibility
try:
    from backend.database import get_database
except ImportError:
    from database import get_database

# Initialize Anthropic client
anthropic = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))

GUIDANCE_SYSTEM_PROMPT = """You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to ask thoughtful, open-ended questions that encourage users to explore their own thinking, assumptions, and potential actions. You must not give direct advice, solutions, or tell users what to do.

Your tone should be supportive, encouraging, and genuinely curious. When users provide insightful or well-articulated ideas, acknowledge and validate their thinking with specific, personalized comments rather than generic praise. Always address the user as "you" and never refer to them as "the user."

After the very first response of a session, you MUST NOT refer to yourself, your role, or your purpose (e.g., "As an AI," "My goal is to," "I'm here to help you"). Your focus must be entirely on the user's content.

You will be given context in placeholders like {{placeholder}}. You must use the information inside these placeholders to inform your response, but you must NEVER include the placeholder syntax (e.g., '{{placeholder}}') in your final response.

CRITICAL RULE FOR QUESTION GENERATION: Your primary goal is to guide the user to a root cause by asking concise, insightful questions. Each question must be a direct follow-up to the user's last response, demonstrating that you are listening. To do this, analyze their response for emerging patterns, key details, or underlying beliefs. Then, ask a brief, targeted question that hones in on the most revealing insight to explore the "why" behind it.

For this task, a "revealing insight" is defined as a statement that most likely points to a deeper, underlying driver of the user's problem. This could be a core belief, an unmet need, a significant emotional trigger, or a foundational assumption. Your question should be designed to test if that insight is, in fact, a true root cause.

Your question must not summarize their response, but rather use a specific detail from it to move the conversation to a deeper level.

You should format your responses using Markdown. Use paragraphs for separation and lists (numbered or bulleted) where appropriate. For bulleted lists, always use the standard markdown syntax with "- " (dash followed by space) at the beginning of each bullet point. Add extra line breaks after each bullet point to improve readability."""

OPTION_GENERATION_SYSTEM_PROMPT = """You are an AI assistant named Nuudle, acting as an expert strategic coach. Your primary goal is to generate specific, actionable, and creative options tailored to the user's unique situation.

Your tone should be encouraging, strategic, and insightful. When generating options, your primary objective is to provide choices that are highly relevant and likely to be effective, based on the user's specific context. As a secondary objective, these options should be diverse and creative, offering a range of distinct paths for the user to consider.

After the very first response of a session, you MUST NOT refer to yourself, your role, or your purpose (e.g., "As an AI," "My goal is to," "I'm here to help you"). Your focus must be entirely on the user's content.

You will be given context in placeholders like {{placeholder}}. You must use the information inside these placeholders to inform your response, but you must NEVER include the placeholder syntax (e.g., '{{placeholder}}') in your final response.

You will be given the user's problem, their identified causes, and their conversational history. Use this context to ensure your suggestions are deeply personalized and relevant. Always address the user as "you."
"""

# Old keyword-based validation functions removed - now using AI-powered validation

def is_input_goal_oriented(text: str) -> bool:
    """
    Detects if the user's input is framed as a goal rather than a problem.
    Returns True if the input contains goal-oriented language.
    """
    trimmed_text = text.strip().lower()
    
    # Goal-oriented keywords and phrases
    goal_keywords = [
        'want to', 'wanna', 'like to', 'hope to', 'aim to', 'need to',
        'my goal is', 'i wish', 'i would like', 'i need', 'i want',
        'can i', 'how to', 'how do i', 'how can i', 'trying to',
        'would love to', 'looking to', 'seeking to', 'planning to'
    ]
    
    # Check if the text contains goal-oriented phrases
    for keyword in goal_keywords:
        if keyword in trimmed_text:
            return True
            
    return False

PROMPTS = {
    "problem_articulation_direct": "Context: You are articulating a problem described in '{{userInput}}'. Your task is ONLY to help you describe your situation more completely. Do NOT suggest any causal factors or root causes. Ask 2-3 open-ended, clarifying questions to help you provide more context about the problem. Focus on the 'what', 'where', 'when', and 'who', not the 'why'. End your response by explaining that a clear problem description is the best starting point for this process. If these questions spark new details, consider updating your description to better frame the situation.",
    
    "problem_articulation_intervention": {
        "intros": [
            "Good start. Let's clarify the problem you're experiencing with a little more detail.",
            "Let's add a bit more context to see the full picture.",
            "A few more details can help uncover important clues.",
            "Let's bring the problem into sharper focus.",
            "Try answering these questions to see what new details emerge."
        ],
        "conclusions": [
            "Use the insights from these questions to update your problem description.",
            "With these new details in mind, please revise your problem statement to continue.",
            "Please update your problem description with any new context you've uncovered.",
            "Take a moment to integrate these details into your problem statement.",
            "Please expand on your problem description using these new insights to proceed."
        ],
        "body": "Your goal is to generate 2-3 simple, open-ended questions that help the user provide more specific, descriptive context about their situation. Your questions must be assumption-free and work whether the user is engaging in the activity frequently, infrequently, or not at all. Focus on understanding the user's current reality.\n\nGenerate thoughtful questions that feel contextually relevant to what the user has shared in '{{userInput}}'. Avoid formulaic or repetitive questions. Present your questions as a bulleted list using '- ' for each point."
    },
    
    "problem_articulation_intervention_goal": {
        "intros": [
            "That's a great goal to have. To help you get there, let's first identify the specific problem that's getting in your way.",
            "Let's explore what's currently standing in your way. Understanding the obstacles will help us develop a more targeted approach.",
            "That sounds like an important goal. To create an effective plan, we need to understand the underlying problem first.",
            "Good goal. Now let's identify the specific challenge or obstacle that's making this goal necessary.",
            "I understand what you're aiming for. Let's explore what problem or situation is driving this need."
        ],
        "conclusions": [
            "Try reframing your goal as a problem statement - describe what's currently not working or what obstacles you're encountering in your daily life. Please update your problem description above with this new framing.",
            "Consider describing this as a problem you're facing - what specific challenges or barriers are you experiencing right now? Please revise your statement above to reflect this problem-focused approach.",
            "It would help to rephrase this as a problem by focusing on what's currently difficult or not working in your situation. Please update your description above using this new perspective.",
            "Think about expressing this as a problem statement - what's currently preventing you from where you want to be, and what does that look like day-to-day? Please revise your problem description above with these insights.",
            "Try restating this as a problem you're experiencing - describe the specific challenges or frustrations you're dealing with in your current circumstances. Please update your problem statement above accordingly."
        ],
        "body": "The user has stated a goal in '{{userInput}}'. Your task is to help them identify the underlying problem that makes this goal necessary. Generate 2-3 questions that help them shift from goal-thinking to problem-thinking. Focus on understanding what's currently happening that they want to change, what obstacles they're facing, or what situation is driving this need. Your questions should help them articulate the specific problem or challenge behind their stated goal.\n\nGenerate thoughtful questions that feel contextually relevant to their goal. Present your questions as a bulleted list using '- ' for each point.\n\nCRITICAL: Your response must contain ONLY the 2-3 questions you generate, formatted as a markdown bulleted list using '- '. Do not add any other text, headers, intros, or conclusions."
    },
    
    "problem_articulation_context_aware": {
        "intros": [
            "That's a great starting point. Digging a little deeper into the details helps ensure you're aiming at the right target.",
            "Think of this first step like drawing a map. The more detail you add now, the easier it will be to navigate to a solution later.",
            "Sometimes, the problem you first see is just a symptom of something deeper. Adding more context helps ensure you're looking at the root of the issue.",
            "Zooming in on the problem by describing it in more detail can often uncover clues that point to the best path forward.",
            "The more clearly you can see the problem, the clearer the solution becomes. Adding a few more details can bring everything into focus."
        ],
        "conclusions": [
            "Use the insights from these questions to update your problem description.",
            "With these new details in mind, please revise your problem statement to continue.",
            "Please update your problem description with any new context you've uncovered.",
            "Take a moment to integrate these details into your problem statement.",
            "Please expand on your problem description using these new insights to proceed."
        ],
        "body": "{{dynamic_intro}}\n\nYour main goal is to help the user expand on their problem statement by providing more specific, descriptive context. To do this, you will generate 2-3 tailored, open-ended questions based on the following logic:\n\na) First, identify the core problem or behavior. The user might state their problem (e.g., \"I drink too much\"). Your task is to ask questions about the underlying behavior (the drinking itself), to better understand the problem.\n\nb) Then, analyze the user's statement in '{{userInput}}' for basic context. Have they already clearly mentioned the 'what', 'where', 'when', or 'who' of the core problem?\n\nc) Finally, generate your questions based on your analysis:\n   - If basic context is MISSING: Ask questions about the core problem to fill in those specific gaps (e.g., \"When does the drinking typically happen?\").\n   - If basic context is ALREADY PROVIDED: Do NOT ask for it again. Instead, ask deeper, more descriptive questions that encourage the user to describe what the problem actually looks and feels like. Prompt them to describe a typical scenario or the specific thoughts and feelings involved. For example, if the user says they \"struggle to fall asleep in bed,\" a good follow-up would be, \"Can you walk me through what a typical night of 'bad sleep' looks like for you from start to finish?\"\n\nDo NOT ask 'why' and do NOT suggest any causal factors.\n\n{{dynamic_conclusion}}\n\nCRITICAL: Do NOT add any other text, formatting, or conversational filler. Your entire response must be only the chosen intro, the questions, and the chosen conclusion."
    },
    
    "problem_articulation_context_aware_goal": {
        "intros": [
            "That's a meaningful goal. To help you achieve it, let's first clearly define the problem that's making this goal necessary.",
            "I understand what you want to accomplish. Let's dig into the specific challenge or situation that's driving this need.",
            "That sounds important to you. To create the most effective path forward, we need to identify the underlying problem first.",
            "Good goal. Now let's explore what's currently happening that makes you want to achieve this.",
            "I can see why that matters to you. Let's identify the specific problem or obstacle that's in your way."
        ],
        "conclusions": [
            "Try reframing your goal as a problem statement - describe what's currently not working or what obstacles you're encountering in your daily life. Please update your problem description above with this new framing.",
            "Consider describing this as a problem you're facing - what specific challenges or barriers are you experiencing right now? Please revise your statement above to reflect this problem-focused approach.",
            "It would help to rephrase this as a problem by focusing on what's currently difficult or not working in your situation. Please update your description above using this new perspective.",
            "Think about expressing this as a problem statement - what's currently preventing you from where you want to be, and what does that look like day-to-day? Please revise your problem description above with these insights.",
            "Try restating this as a problem you're experiencing - describe the specific challenges or frustrations you're dealing with in your current circumstances. Please update your problem statement above accordingly."
        ],
        "body": "The user has stated a goal in '{{userInput}}'. Your main task is to help them identify and articulate the underlying problem that makes this goal necessary. Generate 2-3 tailored, open-ended questions that help them shift from goal-thinking to problem-thinking.\n\nFocus on understanding:\n- What's currently happening that they want to change?\n- What specific obstacles or challenges are they facing?\n- What situation or behavior is driving this need for change?\n\nYour questions should help them articulate the specific problem or challenge behind their stated goal. Avoid asking about motivations or 'why' they want the goal - instead focus on the current reality that makes the goal necessary.\n\nGenerate thoughtful questions that feel contextually relevant to their goal. Present your questions as a bulleted list using '- ' for each point.\n\nCRITICAL: Your response must contain ONLY the 2-3 questions you generate, formatted as a markdown bulleted list using '- '. Do not add any other text, headers, intros, or conclusions."
    },
    
    "root_cause": {
        "intros": [
            "Effective problem-solving means looking past symptoms to find the true drivers. Let's analyze the causes you've identified to trace them back to their origins.",
            "To find the right solutions, we must first understand the real problem. Let's examine the factors you've listed to uncover the underlying 'why'."
        ],
        "headers": {
            "intro": "### Uncovering the 'Why' Behind the 'What'",
            "analysis": "### Examining Your Stated Causes",
            "discovery": "### Exploring Unseen Connections",
            "conclusion": "### Focusing on Foundational Drivers"
        },
        "body": {
            "analysis": "Context: Analyze these causes: '{{userInput}}'. For each cause, you MUST follow this two-step process in every bullet point: STEP 1: Start with a brief, conversational reference without bolding or colons (e.g., '- When you mention using alcohol as a psychological reward...'). STEP 2: MANDATORY evaluation - explicitly state whether this is a SYMPTOM or a ROOT CAUSE. If it's a symptom, explain why and suggest 1-2 deeper root causes. If it's a root cause, validate it and explain why it's foundational. Every bullet point must include this evaluation. Present as bullet points with NO introductory paragraph.",
            "discovery": "Based on your problem and causes, ask 2-3 targeted questions to uncover foundational issues: What core needs aren't being met? What beliefs might be influencing this? What environmental factors are creating pressure? Use context: problem '{{painPoint}}', causes '{{causes}}'.",
            "conclusion": "The goal of this analysis is to help you distinguish symptoms from true foundational drivers. Based on your inputs, consider if deeper needs—like a need for stress relief, acknowledgment, or focus—are the real drivers behind the causes you've listed. Your next crucial step is to use these insights to refine your list of contributing causes. By replacing symptoms with the deeper root causes we've uncovered, you can ensure your action plan targets the real problem, making your solutions far more effective."
        }
    },
    
    "identify_assumptions": {
        "intros": [
            "Great work identifying potential assumptions. Let's explore these beliefs together to understand how they might be influencing your situation.",
            "You've surfaced some interesting assumptions. Let's examine how these beliefs connect to your problem and what we can learn from testing them."
        ],
        "headers": {
            "intro": "### Surfacing Your Hidden Beliefs",
            "analysis": "### Testing Your Assumptions",
            "discovery": "### Uncovering Broader Assumptions",
            "conclusion": "### Building on a Foundation of Truth"
        },
        "body": {
            "analysis": "Present your analysis as a markdown bulleted list, using '- ' for each point. CRITICAL: Do NOT repeat or quote the user's input verbatim. For each assumption from '{{userInput}}', weave a brief, conversational summary into your analysis without using bolding or colons. For example, instead of '**Viewing alcohol as deserved reward:** This assumption seems relevant...', write something like '- Your insight about viewing alcohol as a deserved reward is really valuable to explore. This belief might be influencing how you justify the habit to yourself.' Then evaluate if it's directly relevant to the cause '{{causes}}'. If relevant: Acknowledge the insight, then explore how this belief might be influencing the situation and suggest 1-2 specific ways to test it. If not relevant: Gently note the disconnect, then suggest 1-2 more relevant assumptions. Use collaborative, exploratory language.",
            "discovery": "CRITICAL: Do NOT challenge the user's stated problem or causes. Your task is to infer potential HIDDEN beliefs that might be driving the situation. Based on the problem '{{painPoint}}' and causes '{{causes}}', identify 2-3 unstated assumptions the user might hold. For example, if a cause is 'I need to be perfect,' a hidden assumption might be 'I believe my worth is tied to my performance.' For each assumption, explain the reasoning and suggest a validation method.",
            "conclusion": "Testing assumptions helps build self-awareness. Consider adding validation steps for relevant beliefs to your action plan."
        }
    },
    
    "identify_assumptions_discovery": {
        "intros": [
            "Let's uncover the hidden assumptions shaping your perspective. Identifying these beliefs is crucial for effective problem-solving.",
            "Your problem is filtered through assumptions about what's possible and true. Let's discover what beliefs might be influencing your thinking."
        ],
        "headers": {
            "intro": "### Discovering Your Hidden Assumptions",
            "analysis": "### Analyzing Your Problem and Causes",
            "discovery": "### Potential Assumptions to Consider",
            "conclusion": "### Moving Forward with Greater Awareness"
        },
        "body": {
            "analysis": "CRITICAL: Do NOT challenge the user's stated problem or causes. Your task is to infer potential HIDDEN beliefs that might be driving the situation. Based on the problem '{{painPoint}}' and causes '{{causes}}', identify 2-3 unstated assumptions the user might hold. For example, if a cause is 'I need to be perfect,' a hidden assumption might be 'I believe my worth is tied to my performance.' For each, state the assumption and suggest a validation method.",
            "discovery": "Common assumptions that influence problem-solving: You might assume you need more resources than necessary - test by starting with what you have. You might believe you must handle this alone - try reaching out to someone with relevant experience. You might think you need a perfect solution - experiment with a 'good enough' approach. You might assume change must be dramatic - try the smallest possible improvement.",
            "conclusion": "Add validation steps for worthwhile beliefs to your action plan. This ensures your approach is evidence-based, not assumption-based."
        }
    },
    
    "potential_actions": {
        "intros": [
            "This is a thoughtful list of actions. Let's analyze how effectively they target the underlying drivers of the problem:",
            "Let's explore how your proposed actions connect to the root causes you've identified:",
            "Looking at your proposed actions, let's see how they measure up against the core issues we've uncovered:",
            "Let's dig into these potential solutions to see how well they address the foundational causes of the problem:"
        ],
        "body": """{{dynamic_intro}}

Assume the role of a strategic coach. Your entire response MUST be a seamless, conversational narrative.

**CRITICAL INSTRUCTION:** The following examples are for structural guidance only. Your analysis and response MUST be based *entirely* on the user's provided input in '{{userInput}}' and '{{causes}}'. Do not let the example topics influence your response. Your goal is to apply the *structure* of the examples to the *user's specific situation*.

For each action from '{{userInput}}', you MUST generate a single, distinct bullet point. CRITICAL: You MUST NOT start any bullet point with a summary or bolded text. Instead, weave the user's idea directly into a flowing conversational sentence. Inside each bullet point, you MUST follow this logic:
1. **Intent Analysis:** First, check if the user has already stated a clear, root-cause-oriented intent for the action.
2. **Execute Logic:**
   - **IF INTENT IS CLEAR:** Validate their excellent thinking. You MUST weave a brief, conversational reference to the user's idea directly into your analysis as a single flowing sentence. For example, write something like "- Your idea to find alternative rewards is excellent because it directly addresses the psychological reward mechanism that's driving the habit..." Then elevate it by suggesting a concrete next step.
   - **IF INTENT IS UNCLEAR or SURFACE-LEVEL:** Explore the 'duality of intent'. You MUST weave a brief, conversational reference to the user's idea directly into your analysis as a single flowing sentence. For example, write something like "- When you mention practicing mindfulness techniques, if the goal is simply to distract yourself from cravings, this might provide temporary relief but..." Then explore the two potential intents (surface-level vs. root-cause from '{{causes}}') and conclude with a concrete, actionable suggestion.

After analyzing all actions, if you find a significant, unaddressed root cause from '{{causes}}', you MUST add a section with the header: ### Gap Analysis

Next, you MUST add a section with the header: ### Exploring Additional Opportunities
In this section, suggest 1-2 additional actions that would complement the user's existing plan.

Finally, you MUST add a section with the header: ### Committing to an Effective Plan
In this section, provide a concluding paragraph that summarizes the path forward."""
    },
    
    "perpetuation": {
        "intros": [
            "Understanding how we might unintentionally contribute to our problems builds self-awareness and reveals new paths forward.",
            "Let's examine your role in the system. Recognizing how our habits might maintain problems is the first step to changing them."
        ],
        "headers": {
            "intro": "### Examining Your Role in the System",
            "analysis": "### Analyzing the Potential Impact",
            "discovery": "### Exploring Other Contributing Actions",
            "conclusion": "### Increasing Awareness of Your Potential Role"
        },
        "body": {
            "analysis": "Assume the role of a system analyst. Your task is to evaluate only the hypothetical actions provided in '{{userInput}}'. CRITICAL: You MUST generate one bullet point for EACH action provided by the user. Do NOT add any extra bullet points, summaries, or analyses that are not directly tied to one of the user's inputs. For each action, you must first evaluate if it would genuinely perpetuate the problem. IF IT WOULD: Explain the likely second-order consequence, showing how it would logically reinforce the existing problem cycle (e.g., 'this could lead to...'). IF IT WOULD NOT: Gently disagree and explain why that action is unlikely to reinforce the problem, and perhaps is even neutral or helpful. Maintain an exploratory and supportive tone. Present as bullet points without an introductory paragraph. Context: problem '{{painPoint}}'.",
            "discovery": "Continue your role as a system analyst. In an exploratory tone, brainstorm 2-3 other plausible, hypothetical actions or mindsets that would also perpetuate the problem. Present these as bullet points without a leading introductory sentence.",
            "conclusion": "If any patterns feel familiar, recognizing them is the first step to breaking the cycle. Watch for these dynamics as you implement your action plan."
        }
    },
    
    "action_planning": {
        "intros": [
            "Confidence comes from having a plan to deal with fears, not from having no fears. Let's turn your concerns into actionable strategies.",
            "By naming fears and creating mitigation plans, we can shrink anxieties to manageable size and act with greater confidence."
        ],
        "headers": {
            "intro": "### Turning Fear into Confident Action",
            "analysis": "### Evaluating Your Fears and Plans",
            "discovery": "### Building Confidence and Shifting Perspective",
            "conclusion": "### Moving Forward with Clarity"
        },
        "body": {
            "analysis": "Present your analysis as a markdown bulleted list, using '- ' for each point, with NO introductory paragraph. For each fear and plan from '{{fears}}', weave a brief, conversational summary into your analysis without using bolding or colons. For example, instead of '**Social judgment for not drinking:** This fear seems realistic...', write something like '- Your concern about social judgment when you stop drinking is understandable and quite common. This fear seems realistic because...' Then evaluate if concerns are realistic and plans adequate. For well-founded fears with solid plans, validate and suggest strengthening steps. For exaggerated fears or weak plans, explain why and provide improvements.",
            "discovery": "Strengthen confidence with targeted strategies: Find evidence contradicting worst-case scenarios. Make mitigation strategies specific with concrete actions. Identify overlooked strengths from past challenges. Create small tests before full commitment. Build your support network for advice and encouragement.",
            "conclusion": "Confidence comes from preparation. Add specific preparation steps to your action plan to move forward with courage and wisdom."
        }
    },
    
    "conversational_cause_analysis": {
        "openers": {
            "behavior": "What does this behavior do for you? What need does it meet or feeling does it provide?",
            "belief": "What experiences or observations have led you to this conclusion?",
            "external": "What aspects of this situation are within your influence to change?"
        },
        "follow_ups": {
            "obstacle": "What makes it hard to choose differently in the moment?",
            "trigger": "When are you most likely to do this?",
            "falsifier": "What could you see that would make you change your mind?"
        },
        "depth_pass": "Why do you think that need/feeling exists?",
        "summary_prompt": """**CRITICAL INSTRUCTION - CONTEXT-AWARE TERM INTERPRETATION:**
Before analyzing anything, carefully examine the conversation context, especially the original problem statement and stated cause, to understand the user's specific terminology. Pay special attention to how terms are defined in their problem, but also use common sense. For example, if they mentioned "drinking alcohol" in their original problem, a subsequent reference to "drinking" should usually be understood as "drinking alcohol," unless the context clearly implies otherwise (e.g., "drinking water instead"). Apply this contextual understanding consistently throughout your analysis.

Based on the following conversation about a user's cause, generate 3-4 potential root cause statements that capture the deeper insights revealed through the dialogue.

Each root cause option should:
- Be a complete, actionable statement (not a question)
- Reflect the underlying "why" behind the surface-level cause
- Be distinct from the others
- Be written in first person from the user's perspective

Example format: "I use alcohol as a reward because I don't have other ways to celebrate small wins" or "I avoid difficult conversations because I believe conflict will damage relationships"

Return your response as valid JSON in this exact format:
{
  "root_cause_options": [
    "First root cause statement here",
    "Second root cause statement here",
    "Third root cause statement here",
    "Fourth root cause statement here"
  ]
}""",
        "dynamic_prompt": """
You are a conversational AI helping a user with root cause analysis. Your goal is to ask a single, clear, and straightforward question that helps the user dig deeper into the root cause of their problem.

Based on the user's stated cause and the conversation history, determine the next logical question to ask. The conversation should follow this pattern:

1.  **Opener:** Ask a question to understand the payoff, evidence, or control.
2.  **Follow-up:** Ask a question to understand the obstacle, trigger, or a different perspective.
3.  **Depth Pass:** Ask a "why" question to get to the core of the issue.

Do not ask solution-oriented questions. Focus on understanding the "why" behind the user's stated cause.

Return your response as a JSON object with the key 'question'.
"""
    },
    
    "conversational_action_planning": {
        "openers": {
            "feasibility": "What would you realistically need (time, resources, support) to make this happen?",
            "specificity": "What would this look like in practice? What exactly would you do?",
            "measurement": "How would you know if this action is working? What would success look like?"
        },
        "follow_ups": {
            "obstacles": "What might get in the way of doing this consistently?",
            "timing": "When would be the best time to start this? What would trigger you to take action?",
            "support": "Who or what could help you stay accountable to this?"
        },
        "depth_pass": "Why do you think this approach would be effective for addressing this cause?",
        "summary_prompt": """**CRITICAL INSTRUCTION - CONTEXT-AWARE TERM INTERPRETATION:**
Before analyzing anything, carefully examine the conversation context, especially the original problem statement and stated cause, to understand the user's specific terminology. Pay special attention to how terms are defined in their problem, but also use common sense. For example, if they mentioned "drinking alcohol" in their original problem, a subsequent reference to "drinking" should usually be understood as "drinking alcohol," unless the context clearly implies otherwise (e.g., "drinking water instead"). Apply this contextual understanding consistently throughout your analysis.

Based on the following conversation about action planning for a user's cause, generate 3-4 specific, actionable plan options.

Each action plan option should:
- Be concrete and specific (not vague)
- Include clear steps or implementation details
- Be realistic given the user's context and responses
- Directly address the underlying cause
- Be written as actionable statements

Example format: "Set a 25-minute timer each morning at 9 AM and work on your most important task before checking email" or "Create a implementation intention: When I feel the urge to procrastinate, I will immediately do one small 5-minute task related to my goal"

Return your response as valid JSON in this exact format:
{
  "action_plan_options": [
    "First specific action plan here",
    "Second specific action plan here",
    "Third specific action plan here",
    "Fourth specific action plan here"
  ]
}""",
        "dynamic_prompt": """
You are a conversational AI helping a user plan specific actions to address a cause of their problem. Your goal is to ask a single, clear question that helps the user think through the practical details of taking action.

Based on the user's cause and the conversation history, determine the next logical question to ask. The conversation should follow this pattern:

1. **Opener:** Ask about feasibility, specificity, or measurement
2. **Follow-up:** Ask about obstacles, timing, or support needs
3. **Depth Pass:** Ask why they think this approach would be effective

Focus on helping the user develop concrete, realistic action plans. Ask questions that help them think through implementation details, not just high-level intentions.

Return your response as a JSON object with the key 'question'.
"""
    },
    
    "session_summary": """You worked through a problem described in '{{painPoint}}' with causes described in '{{causes}}', assumptions described in '{{assumptions}}', perpetuations described in '{{perpetuations}}', solutions described in '{{solutions}}', fears described in '{{fears}}', and selected action described in '{{actionPlan}}'.

{{aiInteractionAnalysis}}

Provide a comprehensive summary in JSON format. IMPORTANT: The tone of the summary should be personal and encouraging. Use 'you' and 'your' to refer to the user, and avoid using 'the user'.

CRITICAL INSTRUCTIONS FOR ACTION PLAN:
1. PRIMARY FOCUS: Analyze the entire session to identify the most impactful actions that address the fundamental root causes. The action plan should be strategic and solution-oriented.
2. ASSUMPTION VALIDATION: Only integrate assumption validation steps if a proposed action depends on a critical, unvalidated assumption that could make or break its success. Most action plans may not need explicit validation steps.
3. BALANCE: The action plan should primarily focus on forward momentum and problem-solving, with assumption validation serving as a targeted support mechanism only when necessary.

The JSON structure should be as follows:

{
  "title": "A concise, engaging title for this session",
  "problem_overview": "A 2-3 sentence summary of your core problem",
  "key_insights": [
    "Insight 1: A specific observation about your problem or approach",
    "Insight 2: Another meaningful insight from your analysis",
    "Insight 3: A third insight if warranted"
  ],
  "action_plan": {
    "primary_action": "The most impactful next step to address fundamental root causes (conditionally include assumption validation only if critical)",
    "supporting_actions": [
      "Additional strategic action 1 (may include assumption validation if needed)",
      "Additional strategic action 2 (may include assumption validation if needed)",
      "Additional strategic action 3 if warranted"
    ],
    "timeline": "Suggested timeframe for implementation"
  },
  "feedback": {
    "strengths": "{{feedbackStrengths}}",
    "areas_for_growth": "{{feedbackGrowth}}"
  },
  "conclusion": "An encouraging 2-3 sentence closing that empowers you to take action"
}

Return ONLY the JSON object, no additional text or formatting.""",

  "fear_mitigation": {
      "intros": [
          "Fear is natural when facing change. The key is preparing for what might go wrong so you can act with confidence.",
          "Smart planning means anticipating challenges. Let's build on your initial thoughts to create a comprehensive mitigation strategy.",
          "Your initial mitigation thinking is a great start. Let's enhance it with additional strategies and backup plans.",
          "Effective risk management means having multiple ways to handle obstacles. Let's expand your toolkit."
      ],
      "body": """Act as a critical friend analyzing the user's mitigation plan. Your job is to objectively evaluate their approach and provide superior strategies.

**FULL CONTEXT YOU MUST ANALYZE:**
- **Original Problem:** {{painPoint}}
- **Contributing Cause:** {{contributingCause}}
- **Action Plan:** {{actionPlan}}
- **User's Fear/Concern:** {{fearName}}
- **User's Mitigation Plan:** {{userMitigationInput}}

**CRITICAL INSTRUCTION - CONTEXT-AWARE TERM INTERPRETATION:**
Before analyzing anything, carefully examine the **Original Problem** and **Contributing Cause** to understand the user's specific context. Pay special attention to how terms are defined in their problem, but also use common sense. For example, if they mentioned "drinking alcohol" in their original problem, a subsequent reference to "drinking" should usually be understood as "drinking alcohol," unless the context clearly implies otherwise (e.g., "drinking water instead"). Apply this contextual understanding consistently throughout your analysis.

**CRITICAL FRIEND EVALUATION PROCESS:**

**STEP 1: Evaluate Their Plan**
Critically assess if their mitigation plan '{{userMitigationInput}}' would realistically and effectively address '{{fearName}}' in the context of implementing '{{actionPlan}}' to solve '{{contributingCause}}'. Consider:
- Does it directly counter the specific fear?
- Is it practical given their situation?
- Would it actually prevent or minimize the feared outcome?

**STEP 2: Generate Response Based on Evaluation**

**If their plan IS effective:**
- Options 1-2: Provide concrete enhancements that make their existing approach more robust or comprehensive
- Options 3-4: Suggest additional complementary strategies that work alongside their plan

**If their plan IS NOT effective:**
- Options 1-4: Provide superior alternative strategies that would better address this specific fear in their context

**RESPONSE REQUIREMENTS:**
- No validation, praise, or encouragement language
- Objective, tactical analysis only
- Each option must be specific to their exact situation
- Focus on concrete, measurable actions
- Never suggest extreme or impractical measures
- Use varied, dynamic language - no formulaic phrasing
- Each strategy should feel thoughtfully crafted for their unique context

**CRITICAL:** Return ONLY valid JSON in this exact format:
{
  "mitigation_options": [
    "First mitigation strategy tailored to their situation",
    "Second mitigation strategy addressing their specific context",
    "Third mitigation approach for this particular fear",
    "Fourth tactical strategy for their exact scenario"
  ]
}

Each strategy should be 1-2 complete sentences providing concrete, actionable guidance specific to their fear and circumstances."""
  },
  
  "fear_contingency": {
      "intros": [
          "Even with the best mitigation, sometimes things don't go as planned. Having backup plans builds confidence and resilience.",
          "Contingency planning isn't pessimistic—it's smart. Let's create backup strategies so you're prepared for any scenario.",
          "Your initial contingency thinking shows good preparation. Let's expand your options so you're ready for whatever comes up.",
          "Strong contingency plans free you to take bold action, knowing you have alternatives if needed."
      ],
      "body": """Your goal is to help the user create confident backup plans assuming their fear '{{fearName}}' becomes reality despite their mitigation efforts.

**FULL CONTEXT YOU MUST ANALYZE:**
- **Original Problem:** {{painPoint}}
- **Contributing Cause:** {{contributingCause}}
- **Action Plan:** {{actionPlan}}
- **User's Fear/Concern:** {{fearName}}
- **User's Contingency Thinking:** {{userContingencyInput}}
- **Selected Mitigation Strategies:** {{mitigationStrategies}}

**CRITICAL INSTRUCTION - CONTEXT-AWARE TERM INTERPRETATION:**
Before analyzing anything, carefully examine the **Original Problem** and **Contributing Cause** to understand the user's specific context. Pay special attention to how terms are defined in their problem, but also use common sense. For example, if they mentioned "drinking alcohol" in their original problem, a subsequent reference to "drinking" should usually be understood as "drinking alcohol," unless the context clearly implies otherwise (e.g., "drinking water instead"). Apply this contextual understanding consistently throughout your analysis.

**SCENARIO:** Their mitigation didn't work, and '{{fearName}}' happened while implementing '{{actionPlan}}' to address '{{contributingCause}}'.

**YOUR MISSION:**
1. **Build on their contingency thinking** - Their idea '{{userContingencyInput}}' shows preparation. Expand it with concrete actions.
2. **Address the worst-case scenario** - What specific steps if their fear fully manifests?
3. **Maintain progress toward their goal** - Even if this setback occurs, how can they still address '{{contributingCause}}'?
4. **Show resilience is possible** - Demonstrate that setbacks don't mean failure

**GENERATE EXACTLY 4 BACKUP PLANS THAT:**
- Extend their existing contingency thinking with specific actions
- Provide alternative ways to continue progress if this fear happens
- Are realistic responses to their specific feared outcome
- Connect back to solving their original problem '{{painPoint}}'

**CRITICAL:** Return ONLY valid JSON in this exact format:
{
  "contingency_options": [
    "First specific backup plan building on their contingency thinking",
    "Second specific recovery strategy if their fear manifests",
    "Third specific alternative path to maintain progress",
    "Fourth specific resilience action for this scenario"
  ]
}

Each contingency should be 1-2 complete sentences providing a concrete, actionable backup plan specific to their fear happening in their exact situation."""
  }
}

async def get_claude_response(prompt: str, temperature: float = 0.4, system_prompt: str = GUIDANCE_SYSTEM_PROMPT) -> Dict[str, Any]:
    """Get response from Claude API"""
    try:
        message = anthropic.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            system=system_prompt,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "responseText": message.content[0].text,
            "inputTokens": message.usage.input_tokens,
            "outputTokens": message.usage.output_tokens,
        }
    except Exception as e:
        raise e

def format_context_value(key: str, value: Any) -> str:
    """Format context values for AI prompts"""
    if not value:
        return ''
    
    if key == 'painPoint':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'contributingCause':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'actionPlan':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'fearName':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'userMitigationInput':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'userContingencyInput':
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'mitigationStrategies':
        if isinstance(value, list):
            return ', '.join([str(item) for item in value if item and str(item).strip()])
        return str(value) if isinstance(value, str) else ''
    
    elif key == 'causes':
        if isinstance(value, list):
            filtered_items = []
            for item in value:
                if item:
                    if isinstance(item, str) and item.strip():
                        filtered_items.append(item)
                    elif isinstance(item, dict) and item.get('cause', '').strip():
                        filtered_items.append(item['cause'])
            return ', '.join(filtered_items)
        return ''
    
    elif key == 'perpetuations':
        if isinstance(value, list):
            filtered_items = []
            for item in value:
                if item:
                    if isinstance(item, str) and item.strip():
                        filtered_items.append(item)
                    elif isinstance(item, dict) and item.get('text', '').strip():
                        filtered_items.append(item['text'])
            return ', '.join(filtered_items)
        return ''
    
    elif key == 'solutions':
        if isinstance(value, dict):
            return ', '.join([action for action in value.values() if action and action.strip()])
        return ''
    
    elif key == 'fears':
        if isinstance(value, dict):
            fear_strings = []
            for fear in value.values():
                if fear and (fear.get('name') or fear.get('mitigation') or fear.get('contingency')):
                    parts = []
                    if fear.get('name'):
                        parts.append(f"Fear: {fear['name']}")
                    if fear.get('mitigation'):
                        parts.append(f"Mitigation: {fear['mitigation']}")
                    if fear.get('contingency'):
                        parts.append(f"Contingency: {fear['contingency']}")
                    fear_strings.append('; '.join(parts))
            return ' | '.join(fear_strings)
        return ''
    
    else:
        # For any other keys, try to convert to a readable string
        if isinstance(value, str):
            return value
        elif isinstance(value, list):
            return ', '.join([str(item) for item in value if item and str(item).strip()])
        elif isinstance(value, dict):
            return ', '.join([str(item) for item in value.values() if item and str(item).strip()])
        return str(value)

def is_assumption_input_empty_or_irrelevant(user_input: str, causes: List[str]) -> bool:
    """Determine if user input for assumptions is empty or irrelevant"""
    if not user_input or not user_input.strip():
        return True
    
    trimmed_input = user_input.strip().lower()
    
    # Check for common phrases indicating the user doesn't know
    unknown_phrases = [
        "i don't know", "i dont know", "not sure", "no idea",
        "don't know", "dont know", "unsure", "no assumptions",
        "none", "n/a", "na"
    ]
    
    if any(phrase in trimmed_input for phrase in unknown_phrases):
        return True
    
    # Check if input is too short or generic
    if len(trimmed_input) < 10:
        return True
    
    # Check if input seems unrelated to the causes
    if causes and len(causes) > 0:
        causes_text = ' '.join([str(c) if isinstance(c, str) else str(c.get('cause', '')) for c in causes]).lower()
        input_words = trimmed_input.split()
        cause_words = causes_text.split()
        
        # If there's very little overlap between input and causes, it might be irrelevant
        common_words = [word for word in input_words 
                       if len(word) > 3 and any(word in cause_word or cause_word in word for cause_word in cause_words)]
        
        if len(common_words) == 0 and len(input_words) > 2:
            return True
    
    return False

def analyze_ai_interactions(ai_interaction_log: List[Dict], session_data: Dict) -> Dict[str, str]:
    """Analyze AI interactions and generate adaptive feedback"""
    if not ai_interaction_log or len(ai_interaction_log) == 0:
        return {
            "aiInteractionAnalysis": "No AI interactions were recorded during this session.",
            "feedbackStrengths": "Provide a concise analysis of where the user's thinking was most effective. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and acknowledge their own role? 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs.",
            "feedbackGrowth": "Provide specific, actionable recommendations for improvement. Your analysis must evaluate their performance on the same four dimensions and provide concrete next steps: 1. **Root Cause Identification**: If they mistook symptoms for root causes, explain why and suggest deeper causes to explore. 2. **Assumption Surfacing**: If their assumptions were surface-level, suggest specific deeper beliefs to examine. 3. **Self-Awareness (from Perpetuations)**: If they struggled to see their own role, provide specific behaviors to watch for. 4. **Action Plan Quality**: If their plan was vague, provide specific ways to make it more actionable. Select the 1-2 dimensions with the most opportunity for growth and provide specific, implementable recommendations."
        }

    # Generate analysis text for the prompt
    stages = [interaction.get('stage', '') for interaction in ai_interaction_log]
    ai_interaction_analysis = f"AI Interaction Log Analysis: During this session, you received AI assistance on {len(ai_interaction_log)} occasion(s) across the following stages: {', '.join(stages)}. Use this information to provide adaptive feedback that recognizes whether the user incorporated AI suggestions effectively or missed valuable opportunities for improvement."

    # Generate adaptive feedback based on interaction patterns
    has_root_cause = any(i.get('stage') == 'root_cause' for i in ai_interaction_log)
    has_assumptions = any(i.get('stage') == 'identify_assumptions' for i in ai_interaction_log)
    has_perpetuation = any(i.get('stage') == 'perpetuation' for i in ai_interaction_log)
    has_actions = any(i.get('stage') in ['potential_actions', 'action_planning'] for i in ai_interaction_log)

    feedback_strengths = f"Provide a concise analysis of where the user's thinking was most effective, taking into account their {'engagement with AI assistance' if len(ai_interaction_log) > 0 else 'independent work'}. Your analysis must specifically evaluate their performance on the following four dimensions: 1. **Root Cause Identification**: Did they distinguish between symptoms and true root causes? {'Consider how they responded to AI guidance on root causes.' if has_root_cause else ''} 2. **Assumption Surfacing**: Did they uncover non-obvious or deeply held assumptions? {'Consider how they engaged with AI assistance on assumptions.' if has_assumptions else ''} 3. **Self-Awareness (from Perpetuations)**: Did they identify specific, plausible actions that could perpetuate the problem and acknowledge their own role? {'Consider how they responded to AI guidance on perpetuation patterns.' if has_perpetuation else ''} 4. **Action Plan Quality**: Is their action plan specific, measurable, and directly linked to the root causes? {'Consider how they incorporated AI feedback on their action planning.' if has_actions else ''} Select the 1-2 dimensions where the user showed the most strength and provide specific examples from their session inputs."

    # Build feedback_growth string with proper escaping
    feedback_growth_parts = [
        "Provide specific, actionable recommendations for improvement, considering their ",
        "use of AI assistance" if len(ai_interaction_log) > 0 else "independent approach",
        ". Your analysis must evaluate their performance on the same four dimensions and provide concrete next steps: ",
        "1. **Root Cause Identification**: If they mistook symptoms for root causes, explain why and suggest deeper causes to explore. "
    ]
    
    if has_root_cause:
        feedback_growth_parts.append("If they received AI guidance on root causes but didn't fully incorporate it, gently challenge them to revisit those insights. ")
    
    feedback_growth_parts.extend([
        "2. **Assumption Surfacing**: If their assumptions were surface-level, suggest specific deeper beliefs to examine. "
    ])
    
    if has_assumptions:
        feedback_growth_parts.append("If they received AI help with assumptions but didn't act on it, encourage them to test those assumptions. ")
    
    feedback_growth_parts.extend([
        "3. **Self-Awareness (from Perpetuations)**: If they struggled to see their own role, provide specific behaviors to watch for. "
    ])
    
    if has_perpetuation:
        feedback_growth_parts.append("If they received AI insights about perpetuation patterns but didn't acknowledge their role, provide specific examples to watch for. ")
    
    feedback_growth_parts.extend([
        "4. **Action Plan Quality**: If their plan was vague, provide specific ways to make it more actionable. "
    ])
    
    if has_actions:
        feedback_growth_parts.append("If they received AI feedback on their actions but didn't refine them, suggest specific improvements. ")
    
    feedback_growth_parts.append("Select the 1-2 dimensions with the most opportunity for growth and provide specific, implementable recommendations.")
    
    feedback_growth = "".join(feedback_growth_parts)

    return {
        "aiInteractionAnalysis": ai_interaction_analysis,
        "feedbackStrengths": feedback_strengths,
        "feedbackGrowth": feedback_growth
    }

async def check_rate_limits(user_id: str, session_id: str, stage: str = None) -> Dict[str, Any]:
    """Check rate limits for user - now per-button (per-stage) limits"""
    db = get_database()
    
    # Count per-stage usage for this session
    stage_usage_by_stage = {}
    pipeline = [
        {"$match": {"session_id": session_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    
    async for result in db.ai_interactions.aggregate(pipeline):
        stage_usage_by_stage[result["_id"]] = result["count"]
    
    # Count total session requests for this session
    session_usage = await db.ai_interactions.count_documents({"session_id": session_id})
    
    # Set limits - 5 per button/stage, no daily limit
    stage_limit = 5
    
    # Check if the specific stage is allowed (if stage is provided)
    stage_allowed = True
    stage_usage = 0
    if stage:
        stage_usage = stage_usage_by_stage.get(stage, 0)
        stage_allowed = stage_usage < stage_limit
    
    return {
        "stageAllowed": stage_allowed,
        "stageUsage": stage_usage,
        "stageLimit": stage_limit,
        "sessionUsage": session_usage,
        "stageUsageByStage": stage_usage_by_stage,
        # Keep these for backward compatibility with frontend
        "dailyAllowed": True,  # No daily limits anymore
        "sessionAllowed": True,  # No session limits anymore
        "dailyUsage": 0,
        "dailyLimit": 999,  # High number to indicate no limit
        "sessionLimit": 999  # High number to indicate no limit
    }

async def log_ai_interaction(interaction_data: Dict[str, Any]) -> str:
    """Log AI interaction to database"""
    db = get_database()
    
    # Create interaction document
    interaction_doc = {
        "user_id": interaction_data["userId"],
        "session_id": interaction_data["sessionId"],
        "stage": interaction_data["stage"],
        "created_at": datetime.utcnow(),
        "input_tokens": interaction_data["inputTokens"],
        "output_tokens": interaction_data["outputTokens"],
        "cost_usd": interaction_data["costUsd"]
    }
    
    # Insert the interaction
    result = await db.ai_interactions.insert_one(interaction_doc)
    
    return str(result.inserted_id)


def detect_loop_and_summarize(history: List[str]) -> Optional[str]:
    """
    Detects loops in the conversation and returns a summary if a loop is found.
    """
    if len(history) < 2:
        return None

    # Simple loop detection: check for repeated phrases
    last_response = history[-1].lower()
    for i in range(len(history) - 1):
        if last_response in history[i].lower() or history[i].lower() in last_response:
            summary = "It looks like we've uncovered a key theme. Here's the chain of reasoning:\n"
            for i, item in enumerate(history):
                summary += f"\nWhy #{i+1}: {item}"
            return summary
            
    return None

def detect_user_uncertainty(response: str) -> bool:
    """
    Detects if a user response indicates uncertainty or being stuck.
    """
    if not response or not response.strip():
        return True
    
    response_lower = response.lower().strip()
    
    # Common uncertainty indicators
    uncertainty_phrases = [
        "i'm not sure", "im not sure", "not sure", "don't know", "dont know",
        "no idea", "i don't know", "i dont know", "unsure", "skip", "pass",
        "i guess", "maybe", "i think maybe", "not really sure", "hard to say",
        "i'm stuck", "im stuck", "can't think", "cant think", "no clue"
    ]
    
    # Check for direct matches
    if any(phrase in response_lower for phrase in uncertainty_phrases):
        return True
    
    # Check for very short responses that might indicate uncertainty
    if len(response.strip().split()) <= 3 and any(word in response_lower for word in ["maybe", "sure", "guess"]):
        return True
    
    return False

async def get_next_cause_analysis_question(cause: str, history: List[str], pain_point: str, regenerate: bool = False) -> Dict[str, Any]:
    """
    Determines the next question in the adaptive conversational cause analysis.
    Uses the Root Cause Litmus Test with 2-5 question guardrails.
    Enhanced to handle user uncertainty by asking different types of questions or advancing to completion.
    """
    prompts = PROMPTS['conversational_cause_analysis']
    question_count = len(history) // 2  # Number of completed Q&A pairs
    
    # Enforce minimum 3 questions before allowing completion
    min_questions = 3
    max_questions = 5
    
    # Count uncertain responses in the conversation
    uncertain_count = 0
    if len(history) > 0:
        # Check user responses (odd indices: 1, 3, 5, etc.)
        for i in range(1, len(history), 2):
            if detect_user_uncertainty(history[i]):
                uncertain_count += 1
    
    # If user has been uncertain multiple times and we have minimum questions, advance to completion
    if uncertain_count >= 2 and question_count >= min_questions:
        print(f"Advancing to completion due to user uncertainty (uncertain responses: {uncertain_count})")
        # Generate root causes based on available information
        summary_prompt = prompts['summary_prompt'] + f"""

Pain Point: {pain_point}
Cause: {cause}
Conversation History: {history}

The user has expressed uncertainty multiple times. Generate 4 diverse root cause statements that explore different possibilities for why this cause might exist, even with limited specific information from the conversation."""
        
        root_cause_options = []
        try:
            summary_response = await get_claude_response(summary_prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
            summary_data = json.loads(summary_response['responseText'])
            root_cause_options = summary_data.get("root_cause_options", [])
            print(f"Generated root causes due to uncertainty: {root_cause_options}")
            
        except (json.JSONDecodeError, Exception) as e:
            print(f"Root cause generation failed due to uncertainty: {e}")
            root_cause_options = [
                f"I haven't fully explored what drives '{cause}' yet, but it might be a deeper need I'm not addressing",
                f"There could be beliefs or assumptions behind '{cause}' that I haven't identified",
                f"'{cause}' might be a pattern that serves a purpose I'm not aware of",
                f"External factors might be influencing '{cause}' in ways I haven't recognized"
            ]
        
        return {"root_cause_options": root_cause_options, "is_complete": True}
    
    # If we've asked the maximum questions OR user explicitly requested regeneration, generate root causes
    if question_count >= max_questions or (regenerate and question_count >= min_questions):
        # Enhanced summary prompt for better root cause generation
        summary_prompt = prompts['summary_prompt'] + f"""

Pain Point: {pain_point}
Cause: {cause}
Conversation History: {history}

Generate 4 diverse root cause statements that dig deeper than the surface-level cause. Each should offer a different perspective on why this cause exists."""
        
        root_cause_options = []
        try:
            summary_response = await get_claude_response(summary_prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
            summary_data = json.loads(summary_response['responseText'])
            root_cause_options = summary_data.get("root_cause_options", [])
            print(f"AI generated {len(root_cause_options)} root cause options: {root_cause_options}")
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed for root cause options: {e}")
        except Exception as e:
            print(f"AI response failed for root cause options: {e}")
            
        # If AI didn't generate valid options, use fallback
        if not root_cause_options or len(root_cause_options) == 0:
            print("Using fallback root cause options")
            root_cause_options = [
                f"The underlying need behind '{cause}' isn't being met in healthier ways",
                f"I have beliefs or assumptions that make '{cause}' feel necessary",
                f"There are environmental or situational factors that trigger '{cause}'",
                f"I lack the skills, resources, or support to handle this differently"
            ]
            
        print(f"Final root cause options being returned: {root_cause_options}")
        return {"root_cause_options": root_cause_options, "is_complete": True}

    # If we have at least the minimum questions, evaluate if the latest response is deep enough
    if question_count >= min_questions and len(history) > 0:
        # Get the latest user response
        latest_response = history[-1] if len(history) % 2 == 1 else history[-2]
        
        # Evaluate the depth of the response
        evaluation = await evaluate_root_cause_depth(cause, latest_response)
        
        # Only end the analysis if we meet strict criteria OR if we've reached the maximum questions
        should_complete = False
        
        # Implement dynamic threshold based on question count
        total_score = evaluation.get("total_score", 0)
        
        # Dynamic threshold: increases with more questions to maintain quality
        if question_count >= 4:
            min_score_threshold = 5  # After 4 questions, require higher quality (5/6)
        else:  # question_count == 3 (since min_questions = 3)
            min_score_threshold = 4  # After 3 questions, require solid insights (4/6)
        
        if evaluation.get("success", False) and total_score >= min_score_threshold:
            # AI evaluation succeeded AND score is high enough for a true root cause
            should_complete = True
            print(f"Root cause detected after {question_count} questions with score {total_score} (threshold: {min_score_threshold}). Generating options...")
        elif question_count >= max_questions:
            # We've reached maximum questions, complete regardless of evaluation
            should_complete = True
            print(f"Maximum questions ({max_questions}) reached. Generating options...")
        else:
            # Continue asking questions - either evaluation failed or score not high enough
            if not evaluation.get("success", False):
                print(f"Evaluation failed after {question_count} questions. Continuing analysis...")
            else:
                print(f"Score too low after {question_count} questions (score: {total_score}/{min_score_threshold}). Continuing analysis...")
        
        if should_complete:
            # Use the same summary generation as above
            summary_prompt = prompts['summary_prompt'] + f"""

Pain Point: {pain_point}
Cause: {cause}
Conversation History: {history}

Generate 4 diverse root cause statements that dig deeper than the surface-level cause. Each should offer a different perspective on why this cause exists."""
            
            root_cause_options = []
            try:
                summary_response = await get_claude_response(summary_prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
                summary_data = json.loads(summary_response['responseText'])
                root_cause_options = summary_data.get("root_cause_options", [])
                
            except (json.JSONDecodeError, Exception) as e:
                print(f"Root cause generation failed: {e}")
                root_cause_options = [
                    f"The underlying need behind '{cause}' isn't being met in healthier ways",
                    f"I have beliefs or assumptions that make '{cause}' feel necessary",
                    f"There are environmental or situational factors that trigger '{cause}'",
                    f"I lack the skills, resources, or support to handle this differently"
                ]
            
            return {"root_cause_options": root_cause_options, "is_complete": True}

    # Generate the next question based on evaluation or question count
    if question_count == 0:
        # First question - use dynamic AI generation with intelligent context analysis
        first_question_prompt = f"""You are an AI assistant helping a user start a root cause analysis conversation. Your goal is to generate a single, personalized opening question based on their stated cause.

**User's Stated Cause:** "{cause}"

**Instructions:**
1. Analyze the user's statement to identify the most significant factor they've mentioned. This could be an external event, a personal behavior, an expressed belief, or a feeling.
2. Formulate a single, open-ended question that directly addresses this key factor.
3. Your question should encourage the user to provide more detail about that specific factor to understand the "why" behind it.
4. Do not make assumptions or introduce new concepts. Base your question solely on the information the user has provided.

**Tone and Style Guide:**
- **Be Direct and Clear:** The question should be straightforward and easy to understand. Get straight to the point without unnecessary introductory phrases.
- **Use Natural Language:** Frame the question using simple, everyday language. Avoid academic, clinical, or robotic phrasing.
- **Be Relevant:** The question must be a direct and obvious follow-up to the user's stated cause, showing you have understood their specific situation.

Generate only a single, direct question. Do not include any other text, explanations, or formatting."""

        try:
            ai_result = await get_claude_response(first_question_prompt)
            next_question = ai_result['responseText'].strip()
            print(f"DEBUG: Generated dynamic first question: {next_question}")
        except Exception as e:
            print(f"DEBUG: Error generating dynamic first question: {e}")
            # Fallback to a simple, open-ended question if AI fails
            next_question = "What's behind this? Can you tell me more about what's driving this situation?"
            
    else:
        # Subsequent questions - use adaptive questioning based on latest response
        # History format: [AI_q1, User_a1, AI_q2, User_a2, ...]
        # So user responses are at odd indices (1, 3, 5, etc.)
        latest_response = ""
        if len(history) > 0:
            # Get the last user response (should be at the end for subsequent questions)
            if len(history) % 2 == 0:  # Even length means last item is user response
                latest_response = history[-1]
            elif len(history) > 1:  # Odd length means second-to-last is user response
                latest_response = history[-2]
        
        if latest_response:
            print(f"DEBUG: Latest response: {latest_response}")
            
            # Check if user is showing uncertainty
            is_uncertain = detect_user_uncertainty(latest_response)
            
            if is_uncertain and question_count > 0:
                print(f"DEBUG: User uncertainty detected, generating AI-powered alternative question")
                # Use AI to generate a contextual alternative question based on their response
                uncertainty_prompt = f"""The user is expressing uncertainty about the cause: "{cause}"

Their uncertain response was: "{latest_response}"

Generate a single, empathetic follow-up question that:
- Acknowledges their uncertainty without judgment
- Offers a different angle or perspective to explore the cause
- Incorporates their specific situation and response
- Helps them think about the cause in a new way
- Is conversational and supportive

Return only the question text, no other formatting."""

                try:
                    uncertainty_result = await get_claude_response(uncertainty_prompt)
                    next_question = uncertainty_result['responseText'].strip()
                    print(f"DEBUG: Generated uncertainty question: {next_question}")
                except Exception as e:
                    print(f"DEBUG: Error generating uncertainty question: {e}")
                    # Fallback to contextual alternatives if AI fails
                    alternative_questions = [
                        f"What if we approached '{cause}' from a different angle - when do you NOT experience this issue?",
                        f"Instead of focusing on why '{cause}' happens, what would need to change for it to completely disappear?",
                        f"If someone you trust had the same experience with '{cause}', what would you tell them might be behind it?"
                    ]
                    question_index = min(question_count - 1, len(alternative_questions) - 1)
                    next_question = alternative_questions[question_index]
            else:
                # Normal flow - get evaluation to determine focus area
                evaluation = await evaluate_root_cause_depth(cause, latest_response)
                print(f"DEBUG: Evaluation result: {evaluation}")
                
                if evaluation.get("success", False):
                    focus_area = evaluation.get("suggested_follow_up", "foundational")
                    print(f"DEBUG: Focus area: {focus_area}")
                    
                    # Generate adaptive follow-up question
                    try:
                        next_question = await get_adaptive_follow_up_question(cause, latest_response, focus_area, question_count + 1)
                        print(f"DEBUG: Generated question: {next_question}")
                    except Exception as e:
                        print(f"DEBUG: Error generating adaptive question: {e}")
                        # Use predefined questions as backup
                        question_prompts = {
                            "actionable": "What part of this situation could you actually influence or change?",
                            "foundational": "What deeper need or belief might be driving this pattern?",
                            "causal": "What do you think is the real engine behind this behavior?"
                        }
                        next_question = question_prompts.get(focus_area, "What do you think drives this behavior?")
                else:
                    # Evaluation failed, use fallback based on question count
                    fallback_questions = [
                        "What makes this behavior feel necessary or important to you?",
                        "When did you first notice this pattern starting?",
                        "What would have to change for you to no longer need this behavior?"
                    ]
                    question_index = min(question_count - 1, len(fallback_questions) - 1)
                    next_question = fallback_questions[question_index]
        else:
            # This shouldn't happen in normal flow
            print(f"DEBUG: No latest response found in history: {history}")
            next_question = "What do you think drives this behavior?"

    return {
        "next_question": next_question,
        "is_complete": False
    }

async def get_next_action_planning_question(
    cause: str,
    history: List[str],
    is_contribution: bool = False,
    regenerate: bool = False,
    session_context: Dict[str, Any] = None,
    generation_count: int = 0,
    existing_plans: List[str] = None,
    pain_point: str = None,
    cause_analysis_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Determines the next question in the conversational action planning process.
    Enhanced with session context and input validation for better personalization.
    """
    if existing_plans is None:
        existing_plans = []

    # If regenerate is True or we have enough history (3 complete exchanges = 6 messages), generate action plan options
    if len(history) >= 6 or regenerate:
        # Input validation: Check if user responses are too vague
        user_responses = [history[i] for i in range(1, len(history), 2) if i < len(history)]
        is_vague_input = _detect_vague_action_planning_input(user_responses, cause)
        
        # If input is too vague, return fallback guidance-focused actions
        if is_vague_input and not session_context:
            print(f"FALLBACK TRIGGERED - Vague input detected without session context")
            action_type = "contribution" if is_contribution else "cause"
            fallback_options = _generate_guidance_focused_fallback_options(cause, action_type, user_responses)
            
            return {
                "success": True,
                "is_complete": True,
                "response": "Choose your action plan from the options below:",
                "action_plan_options": fallback_options
            }
        
        # Create a comprehensive prompt for action plan generation with session context
        history_text = "\n".join([f"{'AI' if i % 2 == 0 else 'User'}: {msg}" for i, msg in enumerate(history)])
        print(f"Action planning - History length: {len(history)}")
        print(f"Action planning - Formatted history: {history_text}")
        print(f"Action planning - Session context available: {session_context is not None}")
        
        # Build enhanced context section for the prompt with new parameters
        context_section = ""
        pain_point_context = pain_point or session_context.get('pain_point', '') if session_context else ""
        
        if pain_point_context or session_context or cause_analysis_history:
            context_parts = []
            
            if pain_point_context:
                context_parts.append(f'- **Original Problem:** "{pain_point_context}"')
            
            if session_context:
                if session_context.get('causes'):
                    context_parts.append(f'- **Contributing Causes:** "{session_context.get("causes", "")}"')
                if session_context.get('assumptions'):
                    context_parts.append(f'- **Identified Assumptions:** {session_context.get("assumptions", [])}')
                if session_context.get('perpetuations'):
                    context_parts.append(f'- **Perpetuating Behaviors:** {session_context.get("perpetuations", [])}')
            
            if cause_analysis_history and len(cause_analysis_history) > 0:
                # Format the cause analysis Q&A history
                qa_pairs = []
                for i in range(0, len(cause_analysis_history), 2):
                    if i + 1 < len(cause_analysis_history):
                        question = cause_analysis_history[i].get('text', '')
                        answer = cause_analysis_history[i + 1].get('text', '')
                        if question and answer:
                            qa_pairs.append(f"  Q: {question}\n  A: {answer}")
                
                if qa_pairs:
                    context_parts.append(f'- **Root Cause Analysis Q&A:**\n' + '\n'.join(qa_pairs))
            
            if context_parts:
                context_section = f"""
**COMPREHENSIVE CONTEXT (for highly personalized coaching):**
{chr(10).join(context_parts)}

Use this context to provide Socratic coaching that builds on their specific insights and situation.
"""

        # Determine temperature based on generation count
        if generation_count == 0:
            temperature = 0.4
        elif generation_count == 1:
            temperature = 0.7
        else:
            temperature = 1.0

        # Conditional prompt logic
        if generation_count > 0:
            existing_plans_text = "\n".join([f"- {plan}" for plan in existing_plans])
            existing_plans_section = f"""**Previously Generated Action Plans (for context):**
{existing_plans_text}
"""
            action_planning_prompt = f"""You are an expert action planning coach. Your task is to generate 4 new, specific, and actionable options to address the user's stated cause/contribution.

**Cause/Contribution to Address:** "{cause}"
{context_section}
{existing_plans_section}
**User's Planning Conversation:**
{history_text}

**Instructions:**
- You MUST generate 4 NEW options that are distinct from the "Previously Generated Action Plans" listed above.
- PRIORITIZE session context over conversation details to ensure suggestions are highly relevant and effective.
- Focus on actions that directly address the specific cause while connecting to the user's broader situation.
- If user responses were limited, rely more heavily on the session context.
- Make actions specific to their actual situation, not generic advice.

**Action Requirements:**
- **NEW and DISTINCT:** Must not repeat or be minor variations of previously generated plans.
- **EFFECTIVE and RELEVANT:** Must be a highly effective potential solution for the user's specific problem and causes.
- **Concrete and specific:** (not generic advice)
- **Directly address the stated cause/contribution:**
- **Connect to their broader problem context when possible:**
- **Include implementation details when possible:**
- **Realistic and achievable:**

Generate 4 new, diverse, and effective action options that are personalized to their situation.

Return ONLY valid JSON:
{{
  "action_plan_options": [
    "New, specific action option 1",
    "New, specific action option 2",
    "New, specific action option 3",
    "New, specific action option 4"
  ]
}}"""
        else:
            action_planning_prompt = f"""You are an expert action planning coach. Generate 4 specific, actionable options to address this cause/contribution.

**Cause/Contribution to Address:** "{cause}"
{context_section}
**User's Planning Conversation:**
{history_text}

**Instructions:**
- PRIORITIZE session context over conversation details when available
- Use the original problem and related causes to ensure suggestions are highly relevant
- Focus on actions that address the specific cause while connecting to their broader situation
- If user responses were limited, rely more heavily on the session context
- Make actions specific to their actual situation, not generic advice

**Action Requirements:**
- Concrete and specific (not generic advice)
- Directly address the stated cause/contribution
- Connect to their broader problem context when possible
- Include implementation details when possible
- Realistic and achievable

Generate 4 diverse action options that feel personalized to their specific situation.

Return ONLY valid JSON:
{{
  "action_plan_options": [
    "Specific action option 1",
    "Specific action option 2",
    "Specific action option 3",
    "Specific action option 4"
  ]
}}"""
        
        action_plan_options = []
        try:
            print(f"Sending prompt to AI with temperature {temperature}: {action_planning_prompt}")
            ai_result = await get_claude_response(
                action_planning_prompt,
                temperature=temperature,
                system_prompt=OPTION_GENERATION_SYSTEM_PROMPT
            )
            print(f"Raw AI response for action planning: {ai_result['responseText']}")
            
            # Try to extract JSON even if wrapped in markdown
            response_text = ai_result['responseText'].strip()
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            # Clean up response text to handle line breaks and special characters in JSON strings
            import re
            # Replace literal line breaks in JSON strings with escaped line breaks
            response_text = re.sub(r'(?<!\\)\n(?=\s*["}])', '\\n', response_text)
            # Remove any remaining unescaped line breaks that might cause JSON parsing issues
            response_text = re.sub(r'(?<!\\)\n(?!\s*["}])', ' ', response_text)
            
            summary_data = json.loads(response_text)
            action_plan_options = summary_data.get("action_plan_options", [])
            print(f"Successfully parsed AI generated {len(action_plan_options)} action plan options: {action_plan_options}")
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed for action plan options: {e}")
            print(f"Attempted to parse: '{response_text if 'response_text' in locals() else ai_result['responseText'] if 'ai_result' in locals() else 'No response'}'")
        except Exception as e:
            print(f"AI response failed for action plan options: {e}")
            
        # If AI didn't generate valid options, use intelligent fallback
        if not action_plan_options or len(action_plan_options) == 0:
            print("FALLBACK TRIGGERED - AI failed to generate personalized options")
            print(f"History length: {len(history)}")
            print(f"History content: {history}")
            print(f"Cause: {cause}")
            print(f"Is contribution: {is_contribution}")
            action_type = "contribution" if is_contribution else "cause"
            
            # Analyze user responses to detect vague input and provide better guidance
            user_responses = [history[i] for i in range(1, len(history), 2) if i < len(history)]
            is_vague_input = _detect_vague_action_planning_input(user_responses, cause)
            
            if is_vague_input:
                # Generate guiding, first-step-oriented options for vague input
                action_plan_options = _generate_guidance_focused_fallback_options(cause, action_type, user_responses)
            else:
                # Use standard fallback for non-vague but AI-failed cases
                action_plan_options = [
                    f"Create a specific plan to address this {action_type} with clear steps and timeline",
                    f"Set up environmental changes or cues to help you change this {action_type}",
                    f"Start with one small, immediate step you can take today about this {action_type}",
                    f"Find support or accountability to help you address this {action_type}"
                ]
            
        return {
            "success": True,
            "is_complete": True,
            "response": "Choose your action plan from the options below:",
            "action_plan_options": action_plan_options
        }

    # New Socratic coaching model for dynamic question generation
    question_count = len(history) // 2
    history_text = "\n".join([f"{'AI' if i % 2 == 0 else 'User'}: {msg}" for i, msg in enumerate(history)])
    
    socratic_prompt = f"""You are an expert action planning coach named Nuudle. Your goal is to help the user brainstorm and commit to a concrete, actionable plan to address their stated cause.

**Your Coaching Persona:**
- **Forward-Looking and Practical:** Your focus is on solutions and next steps, not on further analysis of the past.
- **Encouraging and Collaborative:** You are a partner in brainstorming, helping the user build on their own ideas.
- **Focused on Specificity:** You guide the user from vague intentions to specific, measurable actions.

**Comprehensive Context:**
- **Original Problem:** "{pain_point}"
- **Cause to Address:** "{cause}"
- **Root Cause Analysis Q&A (if available):**
{cause_analysis_history or "No root cause analysis was performed for this cause."}
- **Action Planning Conversation So Far:**
{history_text or "This is the first question of the conversation."}

**Your Task:**
Based on all the context, generate a single, insightful follow-up question that moves the user toward a concrete action plan.

**Chain of Thought for Question Generation:**
1.  **Analyze the User's Last Response:** What is the core action they are proposing?
2.  **Assess its "Actionability":** Is the proposed action specific? Is it a concrete step or a vague goal?
3.  **Identify the Most Helpful Next Question:**
    - If the user's idea is vague (e.g., "I'll be more patient"), ask a question to make it concrete (e.g., "That's a great goal. What would being 'more patient' look like in practice in that specific situation?").
    - If the user's idea is a good first step, ask a question to build on it or consider obstacles (e.g., "That's a solid first step. What's one thing that might get in the way of you doing that consistently?").
    - If the user is stuck, offer a prompt to get them started (e.g., "It can be tough to know where to start. What's the absolute smallest, easiest first step you could take to address this?").

**CRITICAL:** Your questions must be about **actions and solutions**, not about further diagnosing the cause. Return only the single question you've generated. No extra text, formatting, or explanation.
"""

    try:
        ai_result = await get_claude_response(socratic_prompt)
        next_question = ai_result['responseText'].strip()
    except Exception as e:
        print(f"Socratic coaching model error: {e}")
        # Fallback to a safe, open-ended question
        next_question = "That's a helpful start. What would be the next logical step to take?"

    return {
        "success": True,
        "response": next_question,
        "is_complete": False
    }

def _detect_vague_action_planning_input(user_responses: List[str], cause: str) -> bool:
    """
    Detect if user responses indicate vague input that needs guidance rather than specific actions.
    """
    if not user_responses:
        return True
        
    # Combine all user responses for analysis
    combined_responses = " ".join(user_responses).lower().strip()
    
    # Check for common vague response patterns
    vague_patterns = [
        "i don't know", "not sure", "no idea", "i'm not sure",
        "don't know", "maybe", "i guess", "probably",
        "i need to", "i want to", "i should", "i have to",
        "just", "simply", "basic", "general", "normal",
        "something", "anything", "whatever", "somehow"
    ]
    
    # Check for overly brief responses (each response less than 8 words on average)
    total_words = len(combined_responses.split())
    avg_words_per_response = total_words / len(user_responses) if user_responses else 0
    is_brief = avg_words_per_response < 8
    
    # Check for vague patterns in responses
    has_vague_patterns = any(pattern in combined_responses for pattern in vague_patterns)
    
    # Check if responses are mostly goal-oriented rather than action-oriented
    goal_keywords = ["want to", "need to", "should", "have to", "trying to", "hope to"]
    action_keywords = ["will", "plan to", "going to", "schedule", "set up", "create", "start", "begin"]
    
    goal_count = sum(1 for keyword in goal_keywords if keyword in combined_responses)
    action_count = sum(1 for keyword in action_keywords if keyword in combined_responses)
    is_goal_heavy = goal_count > action_count and goal_count > 0
    
    # Consider input vague if any of these conditions are met
    return is_brief or has_vague_patterns or is_goal_heavy

def _generate_guidance_focused_fallback_options(cause: str, action_type: str, user_responses: List[str]) -> List[str]:
    """
    Generate guidance-focused action plan options for users with vague input.
    These focus on helping users think through and identify their approach rather than giving generic advice.
    """
    # Analyze the cause to provide contextually relevant guidance
    cause_lower = cause.lower()
    
    # Base guidance options that help with planning and identification
    guidance_options = []
    
    # Option 1: Help identify specific behaviors or patterns
    if "habit" in cause_lower or "always" in cause_lower or "keep" in cause_lower:
        guidance_options.append(
            f"Spend 10 minutes tracking when and why this {action_type} happens over the next 3 days, "
            f"noting triggers, timing, and your mindset each time"
        )
    else:
        guidance_options.append(
            f"Write down 3 specific situations where this {action_type} typically occurs, "
            f"including what leads up to it and how you feel during those moments"
        )
    
    # Option 2: Help identify the smallest first step
    guidance_options.append(
        f"Identify the single smallest change you could make tomorrow that would start addressing this {action_type}, "
        f"even if it's just 5 minutes of preparation or research"
    )
    
    # Option 3: Help clarify what success looks like
    if "replace" in cause_lower or "instead" in cause_lower or "new" in cause_lower:
        guidance_options.append(
            f"List 3 alternative behaviors you could try instead, then choose one to test for just 2 days "
            f"to see how it feels"
        )
    else:
        guidance_options.append(
            f"Define exactly what it would look like if this {action_type} was no longer a problem, "
            f"then identify one specific behavior that would indicate progress"
        )
    
    # Option 4: Help identify resources or support needed
    guidance_options.append(
        f"Identify one person you could talk to about this {action_type} or one resource "
        f"(app, book, method) you could explore this week to get clearer on your approach"
    )
    
    return guidance_options

async def get_ai_response(user_id: str, session_id: str, stage: str, user_input: str, session_context: Dict[str, Any], force_guidance: bool = False) -> Dict[str, Any]:
    """Get AI response for a given stage and context"""
    
    # Check rate limits for this specific stage
    limits = await check_rate_limits(user_id, session_id, stage)
    if not limits["stageAllowed"]:
        return {
            "success": False,
            "error": f"Rate limit reached for this button. You've used {limits['stageUsage']}/{limits['stageLimit']} requests for this type of assistance.",
            "fallback": "You've reached the limit for this button. Continue with your own thinking—you've got this! Other AI buttons are still available.",
            "usage": limits
        }

    # Use user input directly without summarization
    processed_user_input = user_input
    
    prompt = ""
    actual_stage = stage
    
    # Special handling for identify_assumptions stage
    if stage == 'identify_assumptions' and is_assumption_input_empty_or_irrelevant(user_input, session_context.get('causes', [])):
        actual_stage = 'identify_assumptions_discovery'
    
    # No need for special handling - frontend now sends the correct stage directly
    
    prompt_config = PROMPTS.get(actual_stage)
    
    if not prompt_config:
        prompt = ""
    elif actual_stage == 'conversational_cause_analysis':
        cause = session_context.get('cause', '')
        history = session_context.get('history', [])
        pain_point = session_context.get('painPoint', '')
        regenerate = session_context.get('regenerate', False)
        
        result = await get_next_cause_analysis_question(cause, history, pain_point, regenerate)
        
        # Handle different response formats based on completion status
        if result.get("is_complete", False):
            # When complete, we have root_cause_options instead of a question
            response_text = "Please select a root cause option from the choices provided."
            return {
                "success": True,
                "interactionId": None,
                "response": response_text,
                "cost": 0,
                "tokensUsed": 0,
                "usage": await check_rate_limits(user_id, session_id),
                "is_complete": True,
                "root_cause_options": result.get("root_cause_options", [])
            }
        else:
            # When not complete, we have a next question
            return {
                "success": True,
                "interactionId": None,
                "response": result.get("next_question", "Could you tell me more about that?"),
                "cost": 0,
                "tokensUsed": 0,
                "usage": await check_rate_limits(user_id, session_id),
                "is_complete": False
            }
    elif isinstance(prompt_config, str):
        # Handle legacy string prompts
        prompt = prompt_config
    elif isinstance(prompt_config, dict) and 'body' in prompt_config:
        # Special handling for problem_articulation_intervention and goal variants
        if actual_stage in ['problem_articulation_intervention', 'problem_articulation_intervention_goal', 'problem_articulation_context_aware_goal']:
            # Proceed with AI question generation (old validation logic removed)
            instructions = prompt_config['body']
            
            # Replace context placeholders in instructions
            instructions = instructions.replace('{{userInput}}', processed_user_input)
            for key, value in session_context.items():
                formatted_value = format_context_value(key, value)
                instructions = instructions.replace('{{' + key + '}}', formatted_value)
            
            # Create clean prompt asking only for questions
            prompt = f"""[INSTRUCTIONS_START]
You are an AI assistant named Nuudle. These are your specific instructions for this response:

{instructions}

CRITICAL: Your response must contain ONLY the 2-3 questions you generate, formatted as a markdown bulleted list using '- '. Do not add any other text, headers, intros, or conclusions.
[INSTRUCTIONS_END]

Your response (questions only) begins now:"""
            
        else:
            # Handle prompt structure based on body type for other prompts
            prompt_body = ''
            
            if isinstance(prompt_config['body'], str):
                # Unified prompt format - use body directly
                prompt_body = prompt_config['body']
            elif isinstance(prompt_config['body'], dict) and 'headers' in prompt_config:
                # Legacy structured format with headers and sectioned body
                headers = prompt_config['headers']
                body = prompt_config['body']
                prompt_body = f"""[INSTRUCTIONS_START]
You are an AI assistant named Nuudle. These are your specific instructions for this response:

SECTION 1 - Header: {headers.get('analysis', '')}
Instructions: {body.get('analysis', '')}

SECTION 2 - Header: {headers.get('discovery', '')}
Instructions: {body.get('discovery', '')}

SECTION 3 - Header: {headers.get('conclusion', '')}
Instructions: {body.get('conclusion', '')}

CRITICAL: Do not include any of the above instruction text in your response. Your response should be conversational and follow the instructions above. Start your response directly with the content for Section 1.
[INSTRUCTIONS_END]

Your conversational response begins now:"""
            else:
                # Fallback for any other body structure
                prompt_body = f"Follow these instructions:\n\n{prompt_config['body']}"

            # Start with the prompt body
            prompt = prompt_body
            
            # Handle dynamic intro placeholder if it exists
            if 'intros' in prompt_config and prompt_config['intros'] and '{{dynamic_intro}}' in prompt:
                random_intro = random.choice(prompt_config['intros'])
                prompt = prompt.replace('{{dynamic_intro}}', random_intro)
            
            # Handle dynamic conclusion placeholder if it exists
            if 'conclusions' in prompt_config and prompt_config['conclusions'] and '{{dynamic_conclusion}}' in prompt:
                random_conclusion = random.choice(prompt_config['conclusions'])
                prompt = prompt.replace('{{dynamic_conclusion}}', random_conclusion)
    
    # Replace placeholders in prompt
    prompt = prompt.replace('{{userInput}}', processed_user_input)
    for key, value in session_context.items():
        formatted_value = format_context_value(key, value)
        prompt = prompt.replace('{{' + key + '}}', formatted_value)

    try:
        ai_result = await get_claude_response(prompt)
        
        # Special post-processing for problem_articulation_intervention and goal variants
        final_response = ai_result["responseText"]
        if actual_stage in ['problem_articulation_intervention', 'problem_articulation_intervention_goal', 'problem_articulation_context_aware_goal']:
            # Wrap the AI's questions with randomly selected intro and conclusion
            random_intro = random.choice(prompt_config['intros'])
            random_conclusion = random.choice(prompt_config['conclusions'])
            final_response = f"{random_intro}\n\n{ai_result['responseText']}\n\n{random_conclusion}"
        
        # Pricing for Claude 3 Haiku ($ per 1M tokens)
        input_cost = (ai_result["inputTokens"] / 1000000) * 0.25
        output_cost = (ai_result["outputTokens"] / 1000000) * 1.25
        cost_usd = input_cost + output_cost

        interaction_id = await log_ai_interaction({
            "sessionId": session_id,
            "userId": user_id,
            "stage": stage,  # Keep original stage for logging consistency
            "userInput": user_input,
            "sessionContext": session_context,
            "aiResponse": final_response,
            "inputTokens": ai_result["inputTokens"],
            "outputTokens": ai_result["outputTokens"],
            "costUsd": cost_usd
        })

        return {
            "success": True,
            "interactionId": interaction_id,
            "response": final_response,
            "cost": cost_usd,
            "tokensUsed": ai_result["inputTokens"] + ai_result["outputTokens"],
            "usage": await check_rate_limits(user_id, session_id)
        }

    except Exception as error:
        print(f"Anthropic API error: {error}")
        error_message = str(error) if hasattr(error, 'message') else 'The AI service is currently unavailable.'
        return {
            "success": False,
            "error": error_message,
            "fallback": "It seems the AI is having a moment to itself. Please continue with your own thoughts for now.",
            "usage": limits
        }

async def get_ai_summary(user_id: str, session_id: str, session_data: Dict[str, Any], ai_interaction_log: List[Dict] = None) -> Dict[str, Any]:
    """Get AI summary for a completed session"""
    if ai_interaction_log is None:
        ai_interaction_log = []
        
    limits = await check_rate_limits(user_id, session_id, "session_summary")
    if not limits["stageAllowed"]:
        return {
            "success": False,
            "error": f"Rate limit reached for session summary. You've used {limits['stageUsage']}/{limits['stageLimit']} summary requests.",
            "fallback": "You've reached the limit for AI summaries. You can still review your session data.",
            "usage": limits
        }

    prompt = PROMPTS["session_summary"]
    
    # Analyze AI interactions for adaptive feedback
    analysis_result = analyze_ai_interactions(ai_interaction_log, session_data)
    
    # Format session data for the prompt
    formatted_data = {
        "painPoint": session_data.get("pain_point", ""),
        "causes": ", ".join(session_data.get("causes", [])) if isinstance(session_data.get("causes"), list) else "",
        "assumptions": ", ".join(session_data.get("assumptions", [])) if isinstance(session_data.get("assumptions"), list) else "",
        "perpetuations": ", ".join(session_data.get("perpetuations", [])) if isinstance(session_data.get("perpetuations"), list) else "",
        "solutions": ", ".join(session_data.get("solutions", [])) if isinstance(session_data.get("solutions"), list) else "",
        "fears": " | ".join([
            f"Fear: {fear.get('name', '')}; Mitigation: {fear.get('mitigation', '')}; Contingency: {fear.get('contingency', '')}"
            for fear in session_data.get("fears", [])
        ]) if isinstance(session_data.get("fears"), list) else "",
        "actionPlan": session_data.get("action_plan", ""),
        "aiInteractionAnalysis": analysis_result["aiInteractionAnalysis"],
        "feedbackStrengths": analysis_result["feedbackStrengths"],
        "feedbackGrowth": analysis_result["feedbackGrowth"]
    }

    # Replace placeholders in prompt
    for key, value in formatted_data.items():
        prompt = prompt.replace('{{' + key + '}}', str(value))

    try:
        ai_result = await get_claude_response(prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
        
        # Try to parse JSON from the response
        try:
            summary_data = json.loads(ai_result["responseText"])
        except json.JSONDecodeError as parse_error:
            print(f"Failed to parse AI response as JSON: {parse_error}")
            return {
                "success": False,
                "error": "Failed to generate structured summary",
                "fallback": ai_result["responseText"]
            }

        # Pricing for Claude 3 Haiku ($ per 1M tokens)
        input_cost = (ai_result["inputTokens"] / 1000000) * 0.25
        output_cost = (ai_result["outputTokens"] / 1000000) * 1.25
        cost_usd = input_cost + output_cost

        interaction_id = await log_ai_interaction({
            "sessionId": session_id,
            "userId": user_id,
            "stage": "session_summary",
            "userInput": "Session summary request",
            "sessionContext": session_data,
            "aiResponse": ai_result["responseText"],
            "inputTokens": ai_result["inputTokens"],
            "outputTokens": ai_result["outputTokens"],
            "costUsd": cost_usd
        })

        return {
            "success": True,
            "interactionId": interaction_id,
            "summary": summary_data,
            "cost": cost_usd,
            "tokensUsed": ai_result["inputTokens"] + ai_result["outputTokens"],
            "usage": await check_rate_limits(user_id, session_id)
        }

    except Exception as error:
        print(f"Anthropic API error: {error}")
        error_message = str(error) if hasattr(error, 'message') else 'The AI service is currently unavailable.'
        return {
            "success": False,
            "error": error_message,
            "fallback": "Unable to generate AI summary at this time. You can still review your session data.",
            "usage": limits
        }

async def validate_problem_statement(problem_statement: str) -> Dict[str, Any]:
    """
    AI-powered validation of problem statements.
    Returns a dictionary with validation results.
    """
    if not problem_statement or not problem_statement.strip():
        return {
            "success": True,
            "isValid": False,
            "reason": "Problem statement cannot be empty."
        }
    
    # Create a specialized prompt for problem statement evaluation
    validation_prompt = f"""You are a problem statement evaluator. Your task is to determine if the following problem statement contains enough substance to begin meaningful problem-solving work.

EVALUATION CRITERIA:
A problem statement is VALID if it contains at least TWO of these three elements:
1. **Clear problem description**: What is the core issue or challenge?
2. **Contextual details**: When, where, how, or under what circumstances does this occur?
3. **Impact or consequences**: What are the effects or results of this problem?

A problem statement is SIMPLISTIC only if it:
- Is extremely vague with no identifiable problem (e.g., "I feel bad")
- Contains no context, impact, or actionable information (e.g., "I need help")
- Is purely a goal statement without describing any underlying problem (e.g., "I want to be successful")

IMPORTANT: Lean towards approving statements that contain enough substance to work with, even if they are concise. A brief but clear problem description with some context or impact should be considered valid.

Problem statement to evaluate: "{problem_statement.strip()}"

Respond with a JSON object in this exact format:
{{
  "isValid": true/false,
  "reason": "Brief explanation of your evaluation"
}}

Your response must be valid JSON only, no other text."""

    try:
        # Use the existing Claude API function
        ai_result = await get_claude_response(validation_prompt)
        
        # Try to parse the JSON response
        try:
            import json
            validation_result = json.loads(ai_result["responseText"])
            
            return {
                "success": True,
                "isValid": validation_result.get("isValid", False),
                "reason": validation_result.get("reason", "Unable to determine validation status")
            }
            
        except json.JSONDecodeError:
            # If JSON parsing fails, fall back to a simple heuristic
            response_text = ai_result["responseText"].lower()
            is_valid = "true" in response_text or "valid" in response_text
            
            return {
                "success": True,
                "isValid": is_valid,
                "reason": "AI validation completed" if is_valid else "Problem statement needs more detail"
            }
            
    except Exception as e:
        print(f"AI validation error: {e}")
        # Fallback to basic length check if AI fails
        word_count = len(problem_statement.strip().split())
        is_valid = word_count >= 8
        
        return {
            "success": True,
            "isValid": is_valid,
            "reason": "AI validation unavailable, using basic validation" if is_valid else "Problem statement appears too brief"
        }

async def analyze_self_awareness(causes: List[str]) -> Dict[str, Any]:
    """
    Analyze user's submitted causes to determine if they demonstrate self-awareness.
    Returns a boolean indicating whether the user has already identified their own role.
    """
    if not causes or len(causes) == 0:
        return {
            "success": True,
            "selfAwarenessDetected": False,
            "reason": "No causes provided"
        }
    
    # Create a specialized prompt for self-awareness analysis
    causes_text = ', '.join(causes)
    
    analysis_prompt = f"""You are an expert in psychological analysis. Your task is to determine if a user has demonstrated self-awareness of their own role in a problem by analyzing their stated causes.

**CRITICAL ANALYSIS CRITERIA:**

A user demonstrates **true self-awareness** only if they explicitly acknowledge their own actions, behaviors, or mindset as a contributing cause. This means:
- They use "I" statements to describe their own actions (e.g., "I procrastinate," "I react defensively").
- They take ownership of their habits or patterns (e.g., "I have a habit of interrupting people").
- They identify their own limiting beliefs or assumptions (e.g., "I believe I'm not good enough, which makes me avoid challenges").

A user **does NOT demonstrate self-awareness** if their causes are:
- Focused exclusively on external factors (e.g., "The economy is bad").
- Blaming others entirely (e.g., "My partner is the one who is always negative").
- Describing their feelings as a passive experience without acknowledging their role in those feelings (e.g., "I feel unsupported" is NOT self-awareness; "I don't communicate my needs, which leads to me feeling unsupported" IS self-awareness).

**CHAIN OF THOUGHT REASONING:**

Before you provide your final JSON response, you must reason through the following steps:
1. **Analyze each cause individually:** For each cause, determine if it is internally focused (self-aware) or externally focused (blaming/describing).
2. **Synthesize your findings:** Based on your analysis of all the causes, determine if the user has demonstrated a pattern of self-awareness.
3. **Formulate your final answer:** Based on your synthesis, determine the final boolean value for `selfAwarenessDetected` and write a concise reason for your decision.

**User's submitted causes:** "{causes_text}"

**Your JSON Response:**

Respond with a JSON object in this exact format:
{{
  "selfAwarenessDetected": true/false,
  "reason": "Brief explanation of your analysis, including a summary of your chain of thought."
}}

Your response must be valid JSON only, no other text."""

    try:
        # Use the existing Claude API function
        ai_result = await get_claude_response(analysis_prompt)
        
        # Try to parse the JSON response
        try:
            import json
            analysis_result = json.loads(ai_result["responseText"])
            
            return {
                "success": True,
                "selfAwarenessDetected": analysis_result.get("selfAwarenessDetected", False),
                "reason": analysis_result.get("reason", "Analysis completed")
            }
            
        except json.JSONDecodeError:
            # If JSON parsing fails, fall back to a simple heuristic
            response_text = ai_result["responseText"].lower()
            self_awareness_detected = "true" in response_text or "self-awareness detected" in response_text
            
            return {
                "success": True,
                "selfAwarenessDetected": self_awareness_detected,
                "reason": "AI analysis completed" if self_awareness_detected else "No clear self-awareness patterns found"
            }
            
    except Exception as e:
        print(f"Self-awareness analysis error: {e}")
        # Fallback to improved heuristic analysis
        self_awareness_keywords = [
            'i procrastinate', 'i avoid', 'i get defensive', 'i have a habit of',
            'i need to stop', 'i always do', 'i never do', 'i react', 'i choose to',
            'i keep doing', 'i tend to', 'i usually', 'i often', 'my behavior',
            'i don\'t communicate', 'i shut down', 'i get angry', 'i assume'
        ]
        causes_lower = causes_text.lower()
        
        # Check if any cause contains genuine self-aware language patterns
        has_self_awareness = any(keyword in causes_lower for keyword in self_awareness_keywords)
        
        # Additional check: look for "I" statements that describe actions/behaviors, not just feelings
        action_patterns = ['i do ', 'i don\'t ', 'i always ', 'i never ', 'i tend to ', 'i have a habit']
        has_action_awareness = any(pattern in causes_lower for pattern in action_patterns)
        
        # Only consider it self-aware if there are action-oriented self-references
        final_self_awareness = has_self_awareness or has_action_awareness
        
        return {
            "success": True,
            "selfAwarenessDetected": final_self_awareness,
            "reason": "Fallback analysis using improved keyword detection" if final_self_awareness else "No self-referential action patterns detected"
        }

async def generate_action_options(cause: str, is_contribution: bool, user_responses: List[str]) -> List[Dict[str, Any]]:
    """
    Generate action options based on cause analysis and user responses from the action planning modal.
    """
    cause_type = "contribution" if is_contribution else "cause"
    responses_text = "; ".join(user_responses) if user_responses else "No responses provided"
    
    action_planning_prompt = f"""You are an action planning specialist helping users develop realistic, effective actions to address problem causes.

**Context:**
- {cause_type.title()}: "{cause}"
- User's planning responses: "{responses_text}"

**Your Task:**
Generate 3 diverse, actionable options that directly address this {cause_type}. Each option should be:
1. **Specific and concrete** - clear what to do, when, and how
2. **Realistic and achievable** - considers user's actual constraints and resources
3. **Measurable** - includes clear success indicators
4. **Root-cause focused** - addresses the underlying issue, not just symptoms

**Response Format:**
Return a JSON array of action options. Each option should have:
- "text": A clear, specific action statement (1-2 sentences)
- "reasoning": Brief explanation of why this approach would be effective (1 sentence)

Example format:
[
  {{
    "text": "Set a daily 25-minute focused work timer first thing each morning before checking email or social media",
    "reasoning": "This creates a consistent trigger and removes decision fatigue by making it automatic."
  }},
  {{
    "text": "Identify your top priority task the night before and put it prominently on your desk",
    "reasoning": "This reduces morning decision-making and creates visual accountability."
  }}
]

**Critical:** Return only valid JSON. No additional text or formatting."""

    try:
        ai_result = await get_claude_response(action_planning_prompt)
        
        # Try to parse JSON response
        try:
            import json
            action_options = json.loads(ai_result["responseText"])
            
            # Ensure we have a list of options
            if not isinstance(action_options, list):
                action_options = [action_options] if isinstance(action_options, dict) else []
            
            return action_options
            
        except json.JSONDecodeError:
            # Fallback to generic action options if AI fails
            generic_actions = [
                {
                    "text": f"Create a specific plan to address this {cause_type} with clear steps and timeline",
                    "reasoning": "Having a concrete plan makes action more likely than vague intentions."
                },
                {
                    "text": f"Start with the smallest possible step toward resolving this {cause_type}",
                    "reasoning": "Small wins build momentum and reduce the barrier to getting started."
                },
                {
                    "text": f"Set up environmental cues or reminders to help you address this {cause_type}",
                    "reasoning": "External prompts reduce reliance on willpower and memory."
                }
            ]
            return generic_actions
            
    except Exception as e:
        print(f"Action planning error: {e}")
        # Return fallback options
        return [
            {
                "text": f"Create a specific, measurable action plan to address this {cause_type}",
                "reasoning": "Concrete plans are more effective than general intentions."
            },
            {
                "text": f"Start with one small step you can take within the next 24 hours",
                "reasoning": "Immediate action builds momentum toward larger changes."
            }
        ]

async def refine_action(initial_action: str, cause: str, user_feedback: str) -> str:
    """
    Refine an action based on user feedback and the original cause.
    """
    refinement_prompt = f"""You are helping a user refine their action plan to make it more specific and achievable.

**Original Cause:** "{cause}"
**Initial Action:** "{initial_action}"
**User Feedback:** "{user_feedback}"

**Your Task:**
Based on the user's feedback, provide a refined version of their action that is:
1. More specific and concrete
2. Addresses any concerns or obstacles they mentioned
3. Includes clear success metrics
4. Maintains the core intent of their original action

**Response:**
Provide only the refined action statement (2-3 sentences maximum). Do not include explanations or additional text."""

    try:
        ai_result = await get_claude_response(refinement_prompt)
        return ai_result["responseText"].strip()
        
    except Exception as e:
        print(f"Action refinement error: {e}")
        # Return the original action if refinement fails
        return initial_action

async def evaluate_root_cause_depth(cause_text: str, user_response: str = None) -> Dict[str, Any]:
    """
    Evaluates how close a cause or user response is to being a true root cause
    using the Root Cause Litmus Test criteria.
    
    Returns a score and analysis of the depth.
    """
    text_to_analyze = user_response if user_response else cause_text
    
    evaluation_prompt = f"""You are an expert in root cause analysis. Evaluate this statement for depth and causal power.

Statement: "{text_to_analyze}"

Score on two dimensions (0-3 points each):

FOUNDATIONAL DEPTH (How deep is this cause?):
- 3: Core belief/fundamental need - reveals deep psychological drivers, unmet needs, or foundational assumptions about self/world
- 2: Significant behavioral pattern - consistent habits or reactions that show deeper themes
- 1: Surface pattern - observable behaviors without deeper insight
- 0: Just a symptom - feelings or situations without revealing underlying causes

CAUSAL POWER (Does this drive other problems?):
- 3: Explains multiple symptoms - connects to and drives several other issues or behaviors
- 2: Drives some behaviors - clear connections to 1-2 other problems or patterns
- 1: Minor influence - weak connections to other issues
- 0: No clear influence - isolated issue with no apparent broader impact

CRITICAL: Respond with ONLY this JSON format, no other text:
{{
  "total_score": 0,
  "foundational_score": 0,
  "causal_score": 0,
  "is_root_cause": false,
  "reasoning": "Brief analysis",
  "suggested_follow_up": "foundational"
}}

Set is_root_cause to true if total_score >= 5. Set suggested_follow_up to the lowest-scoring dimension."""

    try:
        ai_result = await get_claude_response(evaluation_prompt)
        response_text = ai_result['responseText'].strip()
        
        # Clean up common JSON formatting issues
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '').strip()
        
        # Handle potential line break issues in reasoning field
        import re
        response_text = re.sub(r'(?<!\\)"\s*\n\s*"', '" "', response_text)
        
        evaluation_result = json.loads(response_text)
        
        return {
            "success": True,
            "total_score": evaluation_result.get("total_score", 0),
            "foundational_score": evaluation_result.get("foundational_score", 0),
            "causal_score": evaluation_result.get("causal_score", 0),
            "is_root_cause": evaluation_result.get("is_root_cause", False),
            "reasoning": evaluation_result.get("reasoning", ""),
            "suggested_follow_up": evaluation_result.get("suggested_follow_up", "foundational")
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing failed for root cause evaluation: {e}")
        print(f"Attempted to parse: '{response_text if 'response_text' in locals() else ai_result['responseText'] if 'ai_result' in locals() else 'No response'}'")
        
        # Enhanced fallback with heuristic analysis
        fallback_score = _analyze_root_cause_heuristically(text_to_analyze)
        print(f"Using heuristic fallback analysis with score: {fallback_score}")
        
        return {
            "success": False,
            "total_score": fallback_score["total_score"],
            "foundational_score": fallback_score["foundational_score"],
            "causal_score": fallback_score["causal_score"],
            "is_root_cause": fallback_score["total_score"] >= 5,
            "reasoning": "AI evaluation failed, using heuristic analysis",
            "suggested_follow_up": fallback_score["suggested_follow_up"]
        }
    except Exception as e:
        print(f"Root cause evaluation error: {e}")
        
        # Enhanced fallback for any other errors
        fallback_score = _analyze_root_cause_heuristically(text_to_analyze)
        
        return {
            "success": False,
            "total_score": fallback_score["total_score"],
            "foundational_score": fallback_score["foundational_score"],
            "causal_score": fallback_score["causal_score"],
            "is_root_cause": fallback_score["total_score"] >= 5,
            "reasoning": "Evaluation service unavailable, using heuristic analysis",
            "suggested_follow_up": fallback_score["suggested_follow_up"]
        }

def _analyze_root_cause_heuristically(text: str) -> Dict[str, Any]:
    """
    Provide a heuristic analysis when AI evaluation fails.
    This ensures we don't prematurely end the analysis.
    """
    text_lower = text.lower().strip()
    
    # Foundational score - look for belief/need language and depth indicators
    foundational_score = 1  # Default to low-medium
    if any(pattern in text_lower for pattern in ['i believe', 'i think', 'i feel like', 'i assume', 'i need to be']):
        foundational_score = 2
    if any(pattern in text_lower for pattern in ['i must', 'i have to', 'i should always', 'i\'m not good enough', 'i don\'t deserve', 'core belief', 'fundamental']):
        foundational_score = 3
    # Look for patterns indicating deeper self-referential analysis
    if any(pattern in text_lower for pattern in ['i always', 'i never', 'i tend to', 'i have a pattern of']):
        foundational_score = max(foundational_score, 2)
    
    # Causal score - look for causal language and connections to multiple issues
    causal_score = 1  # Default to low-medium
    if any(pattern in text_lower for pattern in ['because', 'so i', 'which makes me', 'that\'s why', 'leads me to']):
        causal_score = 2
    if any(pattern in text_lower for pattern in ['drives me to', 'compels me', 'forces me to', 'that\'s the root of', 'explains why i']):
        causal_score = 3
    # Look for language indicating multiple symptom connections
    if any(pattern in text_lower for pattern in ['affects everything', 'impacts all', 'causes me to also', 'leads to other']):
        causal_score = max(causal_score, 2)
    
    total_score = foundational_score + causal_score
    
    # Determine suggested follow-up based on lowest score
    scores = {
        "foundational": foundational_score,
        "causal": causal_score
    }
    suggested_follow_up = min(scores, key=scores.get)
    
    return {
        "total_score": total_score,
        "foundational_score": foundational_score,
        "causal_score": causal_score,
        "suggested_follow_up": suggested_follow_up
    }

async def get_adaptive_follow_up_question(cause: str, user_response: str, focus_area: str, question_count: int) -> str:
    """
    Generates a targeted follow-up question based on the evaluation results and user's specific response.
    """
    # Create a more dynamic question based on the context
    dynamic_prompt = f"""You are helping someone explore the root cause of their problem through thoughtful questioning.

**Context:**
- Original Cause: "{cause}"
- User's Response: "{user_response}"
- Focus Area: {focus_area} (actionable = what they can control, foundational = deeper beliefs/needs, causal = what drives this)
- Question Number: {question_count}

**Your Task:**
Generate a single, conversational follow-up question that:
1. Shows you understand and acknowledge their specific response
2. Builds naturally on what they just shared
3. Guides them to explore the {focus_area} dimension more deeply
4. Feels personalized to their situation (not generic)
5. Encourages self-reflection and ownership

**Focus Area Guidelines:**
- actionable: Help them identify what's within their control or influence
- foundational: Help them explore underlying beliefs, needs, or assumptions
- causal: Help them understand what drives or perpetuates this pattern

**Example Approach:**
Instead of asking "What beliefs drive this?" ask something like "You mentioned [specific thing they said] - what do you think that reveals about what you believe is necessary or important?"

Return only the question text, no other formatting or explanation."""

    try:
        ai_result = await get_claude_response(dynamic_prompt)
        return ai_result['responseText'].strip()
    except Exception as e:
        print(f"Failed to generate adaptive follow-up: {e}")
        # Improved fallback questions that are more conversational
        fallback_questions = {
            "actionable": [
                "What part of this feels like something you could actually influence or change?",
                "If you were advising someone else in this exact situation, what would you tell them they have control over?",
                "What would taking ownership of just one piece of this look like?"
            ],
            "foundational": [
                "What does this pattern tell you about what you believe you need or deserve?",
                "If this behavior is serving some purpose, what might that purpose be?",
                "What would have to be true about yourself or your situation for this to make sense?"
            ],
            "causal": [
                "What do you think is really driving this - the engine underneath it all?",
                "If this pattern completely disappeared tomorrow, what would that mean had changed?",
                "When you trace this back, what feels like the real starting point?"
            ]
        }
        questions = fallback_questions.get(focus_area, fallback_questions["foundational"])
        return questions[min(question_count - 1, len(questions) - 1)]

async def get_fear_analysis_options(mitigation_plan: str, fear_context: dict = None):
    """
    Generate mitigation and contingency options for fear analysis
    """
    try:
        # Extract context from fear_context and map to expected prompt keys
        context = fear_context or {}
        
        # Build the request context with properly mapped keys for prompt replacement
        request_context = {
            "painPoint": context.get("painPoint", ""),
            "contributingCause": context.get("contributingCause", ""),
            "actionPlan": context.get("actionPlan", ""),
            "fearName": context.get("fearName", ""),
            "userMitigationInput": context.get("userMitigationInput", ""),
            "userContingencyInput": context.get("userContingencyInput", ""),
            "mitigationStrategies": context.get("mitigationStrategies", [])
        }
        
        # Generate mitigation options using direct AI call
        mitigation_prompt = PROMPTS["fear_mitigation"]["body"]
        
        # Replace placeholders in mitigation prompt
        for key, value in request_context.items():
            formatted_value = format_context_value(key, value)
            mitigation_prompt = mitigation_prompt.replace('{{' + key + '}}', formatted_value)
        
        mitigation_ai_result = await get_claude_response(mitigation_prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
        
        # Generate contingency options using direct AI call
        contingency_prompt = PROMPTS["fear_contingency"]["body"]
        
        # Replace placeholders in contingency prompt
        for key, value in request_context.items():
            formatted_value = format_context_value(key, value)
            contingency_prompt = contingency_prompt.replace('{{' + key + '}}', formatted_value)
        
        contingency_ai_result = await get_claude_response(contingency_prompt, system_prompt=OPTION_GENERATION_SYSTEM_PROMPT)
        
        mitigation_options = []
        contingency_options = []
        
        # Parse mitigation options from JSON response
        if mitigation_ai_result and mitigation_ai_result.get("responseText"):
            try:
                # Clean up JSON response
                response_text = mitigation_ai_result["responseText"].strip()
                if response_text.startswith('```json'):
                    response_text = response_text.replace('```json', '').replace('```', '').strip()
                elif response_text.startswith('```'):
                    response_text = response_text.replace('```', '').strip()
                
                mitigation_response = json.loads(response_text)
                mitigation_options = mitigation_response.get("mitigation_options", [])
                print(f"Successfully parsed {len(mitigation_options)} mitigation options")
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed for mitigation options: {e}")
                # Fallback to parsing the response text
                mitigation_options = parse_ai_suggestions(mitigation_ai_result["responseText"])
        
        # Parse contingency options from JSON response
        if contingency_ai_result and contingency_ai_result.get("responseText"):
            try:
                # Clean up JSON response
                response_text = contingency_ai_result["responseText"].strip()
                if response_text.startswith('```json'):
                    response_text = response_text.replace('```json', '').replace('```', '').strip()
                elif response_text.startswith('```'):
                    response_text = response_text.replace('```', '').strip()
                
                contingency_response = json.loads(response_text)
                contingency_options = contingency_response.get("contingency_options", [])
                # Ensure we never return more than 4 contingency options
                contingency_options = contingency_options[:4]
                print(f"Successfully parsed {len(contingency_options)} contingency options")
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed for contingency options: {e}")
                # Fallback to parsing the response text
                contingency_options = parse_ai_suggestions(contingency_ai_result["responseText"])
        
        print(f"Final result: {len(mitigation_options)} mitigation, {len(contingency_options)} contingency options")
        
        return {
            "mitigation_options": mitigation_options,
            "contingency_options": contingency_options
        }
        
    except Exception as e:
        print(f"Error in get_fear_analysis_options: {e}")
        return {
            "mitigation_options": [],
            "contingency_options": []
        }

def parse_ai_suggestions(response_text: str) -> list:
    """
    Parse AI response text into a list of suggestions
    Looks for numbered lists, bullet points, or line-separated items
    """
    if not response_text:
        return []
    
    lines = response_text.strip().split('\n')
    suggestions = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Remove common list prefixes
        prefixes = ['1.', '2.', '3.', '4.', '5.', '-', '•', '*']
        for prefix in prefixes:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break
        
        # Only add substantial suggestions (more than just a few characters)
        if len(line) > 10:
            suggestions.append(line)
    
    return suggestions[:5]  # Limit to 5 suggestions

# Create a simple AIService class for the routes to use
class AIService:
    async def generate_action_options(self, cause: str, is_contribution: bool, user_responses: List[str]) -> List[Dict[str, Any]]:
        return await generate_action_options(cause, is_contribution, user_responses)
    
    async def refine_action(self, initial_action: str, cause: str, user_feedback: str) -> str:
        return await refine_action(initial_action, cause, user_feedback)