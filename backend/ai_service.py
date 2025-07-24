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

SYSTEM_PROMPT = """You are an AI assistant named Nuudle, designed to help users think through their problems. Your goal is to ask thoughtful, open-ended questions that encourage users to explore their own thinking, assumptions, and potential actions. You must not give direct advice, solutions, or tell users what to do.

Your tone should be supportive, encouraging, and genuinely curious. When users provide insightful or well-articulated ideas, acknowledge and validate their thinking with specific, personalized comments rather than generic praise. Always address the user as "you" and never refer to them as "the user."

After the very first response of a session, you MUST NOT refer to yourself, your role, or your purpose (e.g., "As an AI," "My goal is to," "I'm here to help you"). Your focus must be entirely on the user's content.

You will be given context in placeholders like {{placeholder}}. You must use the information inside these placeholders to inform your response, but you must NEVER include the placeholder syntax (e.g., '{{placeholder}}') in your final response.

CRITICAL RULE: When you reference any information provided by the user from a placeholder (e.g., {{painPoint}}, {{userInput}}, {{causes}}), you must NEVER summarize or rephrase it as an introductory sentence. Instead, incorporate your understanding of their input directly into your analytical bullet points. NEVER repeat the user's input verbatim or quote it directly. Always demonstrate that you understand their input by restating it in a fresh, concise way within your analysis.

You should format your responses using Markdown. Use paragraphs for separation and lists (numbered or bulleted) where appropriate. For bulleted lists, always use the standard markdown syntax with "- " (dash followed by space) at the beginning of each bullet point. Add extra line breaks after each bullet point to improve readability."""

def is_problem_good_enough(text: str) -> bool:
    """
    Tier 1 validation: Combined Threshold Validation for "Begin" button.
    Returns False if the problem statement is too simplistic to proceed.
    Uses word count and context keywords to determine if statement is well-articulated.
    """
    trimmed_text = text.strip().lower()
    
    # Context keywords - provide descriptive detail about the problem
    context_keywords = [
        # Descriptive circumstances
        'when', 'where', 'during', 'while', 'after', 'before', 'at work', 'at home',
        'in the morning', 'at night', 'daily', 'weekly', 'every time', 'always', 'never',
        'often', 'sometimes', 'usually', 'frequently', 'rarely',
        # Emotional/physical states
        'feel', 'feeling', 'struggle', 'hard', 'difficult', 'easy', 'challenging',
        'frustrated', 'overwhelmed', 'anxious', 'worried', 'stressed', 'tired', 'exhausted',
        'motivated', 'unmotivated', 'confident', 'insecure',
        # Specific details & constraints
        'can\'t', 'cannot', 'don\'t', 'won\'t', 'unable', 'try', 'trying', 'attempt',
        'fail', 'failing', 'succeed', 'successful', 'unsuccessful', 'stuck', 'blocked',
        # Causal/explanatory
        'because', 'since', 'due to', 'caused by', 'leads to', 'results in',
        'so that', 'in order to', 'to achieve', 'to help', 'to improve',
        # Quantitative/specific
        'too much', 'too little', 'not enough', 'more than', 'less than', 'about',
        'around', 'approximately', 'exactly', 'specifically', 'particularly'
    ]
    
    # Combined Threshold Validation:
    # A statement is valid if it has at least 8 words AND at least 2 contextual keywords
    word_count = len(trimmed_text.split())
    context_keyword_count = sum(1 for keyword in context_keywords if keyword in trimmed_text)
    
    # A statement is good enough if it's long enough AND has sufficient context
    if word_count >= 8 and context_keyword_count >= 2:
        return True
    
    return False

def is_problem_well_articulated(text: str) -> bool:
    """
    Tier 2 validation: Check if problem statement is well-articulated for "Help Me Nuudle" button.
    Returns True if the problem statement has both general context AND deeper contextual details.
    Higher threshold - looks for motivation, obstacles, and comprehensive context.
    """
    trimmed_text = text.strip().lower()
    
    # General context keywords (same as Tier 1)
    general_keywords = [
        'what', 'which', 'how', 'where', 'location', 'place', 'at work', 'at home', 'in',
        'when', 'time', 'during', 'while', 'after', 'before', 'daily', 'weekly', 'monthly',
        'want', 'need', 'try', 'goal', 'aim', 'feel', 'feeling', 'struggle', 'hard', 'difficult',
        'can\'t', 'cannot', 'don\'t', 'not', 'every time', 'always', 'never', 'often', 'sometimes',
        'specifically', 'particularly', 'especially', 'regarding', 'concerning', 'about'
    ]
    
    # Deeper contextual keywords (motivation, obstacles, why)
    deeper_keywords = [
        # Motivational indicators
        'because', 'since', 'due to', 'so that', 'in order to', 'to achieve', 'for the purpose',
        'to ensure', 'to improve', 'to reduce', 'to increase', 'to help', 'to make',
        'motivated', 'motivation', 'reason', 'reasons', 'why', 'purpose', 'goal', 'goals',
        # Obstacle/challenge indicators
        'obstacle', 'obstacles', 'challenge', 'challenges', 'problem', 'problems', 'issue', 'issues',
        'difficulty', 'difficulties', 'barrier', 'barriers', 'struggle', 'struggles', 'hard', 'difficult',
        'prevent', 'prevents', 'stop', 'stops', 'block', 'blocks', 'interfere', 'interferes',
        'past', 'before', 'previously', 'tried', 'attempt', 'attempts', 'failed', 'unsuccessful'
    ]
    
    # Count keywords in each category
    general_count = sum(1 for keyword in general_keywords if keyword in trimmed_text)
    deeper_count = sum(1 for keyword in deeper_keywords if keyword in trimmed_text)
    
    # Check for question words
    question_words = ['who', 'what', 'where', 'when', 'why', 'how']
    has_question_words = any(word in trimmed_text for word in question_words)
    
    # Well-articulated criteria:
    # 1. Must have reasonable length (at least 10 words)
    # 2. Must have general context (at least 2 general keywords OR question words)
    # 3. Must have deeper context (at least 1 deeper keyword)
    word_count = len(trimmed_text.split())
    
    has_general_context = general_count >= 2 or has_question_words
    has_deeper_context = deeper_count >= 1
    
    return word_count >= 10 and has_general_context and has_deeper_context

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

def is_problem_simplistic(text: str) -> bool:
    """
    Legacy function maintained for backward compatibility.
    Now uses the Tier 1 validation (good enough for Begin button).
    """
    return not is_problem_good_enough(text)

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
    
    "session_summary": """You worked through a problem described in '{{painPoint}}' with causes described in '{{causes}}', assumptions described in '{{assumptions}}', perpetuations described in '{{perpetuations}}', solutions described in '{{solutions}}', fears described in '{{fears}}', and selected action described in '{{actionPlan}}'.

{{aiInteractionAnalysis}}

Provide a comprehensive summary in JSON format. IMPORTANT: The tone of the summary should be personal and encouraging. Use 'you' and 'your' to refer to the user, and avoid using 'the user'.

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
    "primary_action": "The most important next step for you to take",
    "supporting_actions": [
      "Additional action 1",
      "Additional action 2"
    ],
    "timeline": "Suggested timeframe for implementation"
  },
  "feedback": {
    "strengths": "{{feedbackStrengths}}",
    "areas_for_growth": "{{feedbackGrowth}}"
  },
  "conclusion": "An encouraging 2-3 sentence closing that empowers you to take action"
}

Return ONLY the JSON object, no additional text or formatting."""
}

async def get_claude_response(prompt: str) -> Dict[str, Any]:
    """Get response from Claude API"""
    try:
        message = anthropic.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
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
    elif isinstance(prompt_config, str):
        # Handle legacy string prompts
        prompt = prompt_config
    elif isinstance(prompt_config, dict) and 'body' in prompt_config:
        # Special handling for problem_articulation_intervention and goal variants
        if actual_stage in ['problem_articulation_intervention', 'problem_articulation_intervention_goal', 'problem_articulation_context_aware_goal']:
            # First, check if the input is well-articulated using Tier 2 validation
            # Skip this check if force_guidance is True (user needs help regardless of validation)
            if not force_guidance and is_problem_well_articulated(processed_user_input):
                # Input is well-articulated, return validation message immediately
                validation_message = "This is a great, well-articulated problem description. You've provided excellent context to get started. Click 'Begin' to move on to the next step."
                
                # Log the interaction (no AI call was made, so we'll use minimal token counts)
                interaction_id = await log_ai_interaction({
                    "sessionId": session_id,
                    "userId": user_id,
                    "stage": stage,
                    "userInput": user_input,
                    "sessionContext": session_context,
                    "aiResponse": validation_message,
                    "inputTokens": 0,
                    "outputTokens": 0,
                    "costUsd": 0.0
                })
                
                return {
                    "success": True,
                    "interactionId": interaction_id,
                    "response": validation_message,
                    "cost": 0.0,
                    "tokensUsed": 0,
                    "usage": await check_rate_limits(user_id, session_id)
                }
            
            # Input needs more context, proceed with AI question generation
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
        ai_result = await get_claude_response(prompt)
        
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