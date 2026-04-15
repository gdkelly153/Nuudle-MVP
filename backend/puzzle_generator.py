"""
Daily Lateral Thinking Puzzle Generation Service
Generates unique multi-component narrative puzzles using the Storyteller's Framework
"""
import os
import json
from typing import Dict, Any, List
from datetime import datetime
import pytz

# Import database functions
try:
    from backend.database import get_database
    from backend.ai_service import get_claude_response
except ImportError:
    from database import get_database
    from ai_service import get_claude_response

# Define Pacific timezone
PACIFIC_TZ = pytz.timezone('America/Los_Angeles')

DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]

def clean_json_response(response_text: str) -> str:
    """
    Clean and prepare AI response text for JSON parsing.
    Handles common issues like markdown code blocks and control characters.
    """
    import re
    
    # Remove markdown code blocks
    if response_text.startswith('```json'):
        response_text = response_text.replace('```json', '').replace('```', '').strip()
    elif response_text.startswith('```'):
        response_text = response_text.replace('```', '').strip()
    
    # Try to parse as-is first
    try:
        json.loads(response_text)
        return response_text
    except json.JSONDecodeError:
        pass
    
    # Extract just the JSON object - find the first { and last }
    first_brace = response_text.find('{')
    last_brace = response_text.rfind('}')
    
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_str = response_text[first_brace:last_brace + 1]
    else:
        json_str = response_text
    
    # AGGRESSIVE CLEANING: Replace ALL control characters and newlines
    # This is a simpler, more reliable approach
    cleaned_chars = []
    in_string = False
    prev_char = ''
    
    for i, char in enumerate(json_str):
        # Track if we're inside a string value
        if char == '"' and prev_char != '\\':
            in_string = not in_string
            cleaned_chars.append(char)
            prev_char = char
            continue
        
        # If we're inside a string, aggressively escape ALL control characters
        if in_string:
            char_code = ord(char)
            if char_code < 32 or char_code == 127:  # Control characters
                if char == '\n':
                    cleaned_chars.append(' ')  # Replace newlines with spaces
                elif char == '\r':
                    continue  # Skip carriage returns
                elif char == '\t':
                    cleaned_chars.append(' ')  # Replace tabs with spaces
                else:
                    cleaned_chars.append(' ')  # Replace other control chars with spaces
            else:
                cleaned_chars.append(char)
        else:
            # Outside strings, preserve structure but clean up
            if char in ['\n', '\r', '\t']:
                cleaned_chars.append(' ')  # Replace with space for readability
            else:
                cleaned_chars.append(char)
        
        prev_char = char
    
    cleaned = ''.join(cleaned_chars)
    
    # Try parsing the cleaned version
    try:
        json.loads(cleaned)
        return cleaned
    except json.JSONDecodeError as e:
        print(f"JSON parsing still failed after cleaning: {e}")
        print(f"Cleaned JSON (first 300 chars): {cleaned[:300]}")
        # Return the cleaned version anyway - it's the best we can do
        return cleaned

async def generate_core_concept(previous_puzzles: List[str]) -> Dict[str, Any]:
    """
    Step 1: Generate a unique, logical core concept for a LATERAL THINKING PUZZLE.
    This focuses on creating a mysterious scenario with interlocking narrative elements.
    
    Returns:
        Dict containing theme, difficulty, scenario, and key narrative elements
    """
    concept_prompt = f"""You are a Master Puzzle Crafter specializing in lateral thinking puzzles.
Your task is to generate ONE high-quality puzzle concept that delivers a clear, clever, and satisfying “Aha!” moment.

Follow ALL rules and structure below.

============================================================
🎯 CORE PRINCIPLES OF A GREAT LATERAL THINKING PUZZLE
============================================================

1. **Clear, Intriguing Scenario**
   Present an odd or contradictory situation that immediately sparks curiosity.
   It should invite questions and use ordinary words in ways that encourage FALSE assumptions.

2. **Hidden Assumptions & Misleading Framing**
   The scenario must subtly guide solvers toward a logical but incorrect interpretation, which the solution overturns.

3. **A Single, Strong Aha! Moment**
   When the true context is revealed, ALL details should make sense at once.
   The solution must feel clever, fair, and inevitable in hindsight.

4. **Solvable but Not Trivial**
   Provide enough information that a determined solver could deduce the truth via questioning, but not so much that the twist is obvious.

5. **Minimal Irrelevant Distractions**
   Every detail must either support the misleading interpretation OR become meaningful in the real explanation.
   No arbitrary red herrings.

6. **One Canonical Solution**
   The puzzle must have one coherent explanation that satisfies all details.
   No multiple endings, no alternate “could also be true” interpretations.

============================================================
🔮 REQUIRED TWIST ARCHETYPE (CHOOSE EXACTLY ONE)
============================================================

Your puzzle MUST be built around EXACTLY ONE of the following classic lateral-thinking twist archetypes.

The chosen archetype must be the backbone of the puzzle and essential to the Aha! moment.

1. **Misinterpreted Object** – An everyday object is being used in an unusual or non-standard way
   (e.g., “straw” = short straw; “bar” = metal bar; “car” = elevator car; “light” = body weight)

2. **Hidden Survival Context** – The scenario hides the fact that characters are in a life-or-death situation
   (e.g., failing hot-air balloon, submarine issue, avalanche, dehydration)

3. **Incorrect Assumption of Identity or Role** – A character’s profession or relationship is not what the solver assumes
   (e.g., “intruder” = firefighter; “killer” = exterminator)

4. **Non-Linear or Reframed Timeline** – Events did NOT occur in the assumed order
   (e.g., someone who “died falling” actually died earlier)

5. **Mechanical/Physical Trick** – Something seemingly impossible is caused by a physical mechanism or natural process
   (e.g., locked-room puzzles, vanishing footprints, melted ice platforms)

6. **Ambiguous Phrase or Linguistic Misleading** – A phrase intentionally encourages the wrong parsing
   (e.g., “He left with nothing but his hands” → applause)

7. **Hidden Social Dynamics** – Relationships or social roles differ from what the solver assumes
   (e.g., rivals instead of friends; patient instead of stranger)

**The twist archetype must:**
- fully resolve the mystery
- make all odd details click simultaneously
- reverse at least one common assumption
- feel plausible and grounded in real-world logic

============================================================
🎨 CREATIVE RULES (FLEXIBLE, TO ALLOW VARIETY)
============================================================

- You may vary tone, setting, pacing, and style.
- Any ending question is allowed (“What happened?”, “Why is this?”, etc.).
- The scenario may include characters, objects, and mild color as long as ALL details matter.
- Avoid sterile puzzles; some atmospheric detail is fine if meaningful.
- The narrative should feel fresh and not derivative of classic or recent puzzles.

============================================================
🧱 PUZZLE COMPONENT RULES (DYNAMIC LENGTH)
============================================================

You MUST generate a **dynamic-length list** called `"puzzle_components"`.

- These are NOT hints, NOT clues, NOT meta-explanations.
- They are **the specific unresolved elements of the scenario that the solver must figure out**.
- These are the “checklist” items necessary to fully solve the puzzle.
- Typical count: **1 to 5** (never fixed; depends on the puzzle).
- Each component must be a short phrase or question referencing a concrete mystery from the scenario.
- All components must be resolved by the hidden_context.

Example structure:
- “Why X?”
- “What explains Y?”
- “What is the significance of Z?”

============================================================
🧪 ANTI-DRIFT & ANTI-SEMANTIC-BLEED RULES
============================================================

To maintain format integrity:

- Output **ONLY** the JSON object (no commentary, no markdown, no reasoning).
- Do NOT include instructions, meta-reasoning, or explanations inside JSON fields.
- Do NOT reveal the twist inside the scenario.
- Do NOT leak archetype names into the scenario.
- Do NOT add extra fields, change field names, or wrap JSON in code fences.
- Ensure the JSON parses cleanly without stray characters.

============================================================
🆕 NOVELTY FILTER (AVOID DERIVATIVES)
============================================================

Avoid puzzles that:
- resemble or reuse the structure, twist, or objects of puzzles in {{recent_puzzles}}
- imitate classic lateral thinking puzzles (e.g., balloon straw sacrifice, bartender/gun/water, melted ice block, desert death)
- rely on repetitive tropes unless given a genuinely fresh twist
- revolve around death unless done sparingly and with originality

Aim for **novel, clever, and unexpected**, not bizarre or random.

============================================================
📦 STRICT JSON OUTPUT (REQUIRED)
============================================================

Return ONLY this JSON object:

{{
  "theme": "Brief description of the misdirection technique.",
  "difficulty": "Easy/Medium/Hard",
  "scenario": "Short puzzling narrative ending with a natural question.",
  "hidden_context": "One-sentence real-world explanation that resolves the puzzle.",
  "puzzle_components": [
    "Dynamic list of the unresolved elements the solver must answer, derived from the scenario. 1–5 items."
  ],
  "logical_explanation": "How the false assumption is overturned and why it produces the Aha! moment."
}}

No additional text before or after the JSON.

============================================================
🏁 FINAL REQUIREMENT
============================================================
All unusual details in the scenario must click together cleanly and satisfy the twist when the hidden context is revealed.
"""

    try:
        ai_result = await get_claude_response(concept_prompt, temperature=0.9)
        response_text = ai_result['responseText'].strip()
        
        # Clean and parse JSON
        cleaned_text = clean_json_response(response_text)
        concept_data = json.loads(cleaned_text)
        
        # Validate required fields
        required_fields = ["theme", "difficulty", "scenario", "hidden_context", "puzzle_components", "logical_explanation"]
        if all(field in concept_data for field in required_fields):
            print(f"✓ Generated concept: {concept_data['theme'][:60]}...")
            return concept_data
        else:
            raise ValueError("Missing required fields in concept generation")
            
    except Exception as e:
        print(f"Error generating concept: {e}")
        raise


async def generate_riddle_and_solution(concept: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 2: Generate a LATERAL THINKING PUZZLE based on the approved concept.
    This transforms the concept into an engaging narrative puzzle.
    
    Returns:
        Dict containing puzzle_text and solution
    """
    puzzle_prompt = f"""You are a master puzzle writer using the STORYTELLER'S FRAMEWORK. You have been given an approved concept for a LATERAL THINKING PUZZLE. Your job is to craft the puzzle text and solution.

**Approved Concept:**
- Theme: {concept['theme']}
- Difficulty: {concept['difficulty']}
- Scenario: {concept['scenario']}
- Hidden Context: {concept['hidden_context']}
- Puzzle Components: {', '.join(concept['puzzle_components'])}
- Logic: {concept['logical_explanation']}

**THE STORYTELLER'S CREATIVE PROCESS:**

Your task is to transform the concept into an engaging lateral thinking puzzle.

**Step 1: Craft the Mysterious Scenario**
Present the scenario in a way that:
- Immediately captures attention with its mysterious or contradictory nature
- Is clear and concise (2-4 sentences)
- Provides just enough detail to be intriguing without giving away the answer
- Ends with "What's going on?" or a similar question

**Step 2: Write the Solution**
Provide a clear, comprehensive solution that:
- States the hidden context directly
- Explains how the scenario makes sense given this context
- Shows how each puzzle component reveals part of the truth
- Is satisfying and makes the solver think "Aha! That makes perfect sense!"

**CRITICAL RULES:**

1. **BE MYSTERIOUS:** The scenario should seem impossible or contradictory at first
2. **BE CLEAR:** Every detail in the scenario must be relevant and accurate
3. **NO CONTRADICTIONS:** The solution must logically explain every aspect of the scenario
4. **BE SATISFYING:** The "aha moment" should feel rewarding and logical

**Response Format:**
You MUST return ONLY valid JSON:
{{
  "puzzle_text": "Your mysterious scenario here (2-4 sentences ending with a question)",
  "solution": "Your comprehensive solution here (explains the hidden context and how it resolves the mystery)"
}}

**Examples:**

Easy (Hiccups):
{{
  "puzzle_text": "A man walks into a bar and asks the bartender for a glass of water. The bartender pulls out a gun and points it at the man. The man says 'thank you' and leaves without the water. What's going on?",
  "solution": "The man had hiccups, and the bartender realized this immediately. Instead of giving him water, the bartender scared the hiccups away by pointing a gun at him. The shock cured the hiccups, which is why the man thanked him and no longer needed the water."
}}

Medium (Photography):
{{
  "puzzle_text": "A woman shoots her husband, then holds him underwater for five minutes. Thirty minutes later, they both go out to dinner together, happy and unharmed. What happened?",
  "solution": "The woman is a photographer. She 'shot' her husband with a camera, taking his photograph. She then 'held him underwater' by developing the photograph in a darkroom, where photos are submerged in chemical baths. The photography terminology created the mystery - no one was ever in danger."
}}

Hard (Elevator):
{{
  "puzzle_text": "A man lives on the 10th floor of an apartment building. Every morning, he takes the elevator down to the lobby and goes to work. When he returns in the evening, he takes the elevator to the 7th floor and walks up the remaining three flights of stairs to his apartment. He does this every single day. What's going on?",
  "solution": "The man is very short (possibly a little person or a child). He can easily reach the lobby button when going down, but when going up, he can only reach as high as the 7th floor button. He cannot reach the 10th floor button, so he rides to the 7th floor and walks the rest of the way. His height limitation explains his daily routine."
}}

Generate your puzzle now. Remember: MYSTERIOUS, CLEAR, LOGICAL, SATISFYING. Return ONLY the JSON object."""

    try:
        ai_result = await get_claude_response(puzzle_prompt, temperature=0.7)
        response_text = ai_result['responseText'].strip()
        
        # Clean and parse JSON
        cleaned_text = clean_json_response(response_text)
        puzzle_data = json.loads(cleaned_text)
        
        # Validate required fields
        required_fields = ["puzzle_text", "solution"]
        if all(field in puzzle_data for field in required_fields):
            print(f"✓ Generated puzzle: {puzzle_data['puzzle_text'][:60]}...")
            return puzzle_data
        else:
            raise ValueError("Missing required fields in puzzle generation")
            
    except Exception as e:
        print(f"Error generating puzzle: {e}")
        raise


async def extract_puzzle_components(puzzle_text: str, solution: str, difficulty: str) -> Dict[str, Any]:
    """
    Step 3: Extract 1-5 distinct puzzle components for a LATERAL THINKING PUZZLE.
    Each component is a specific unresolved element of the scenario that the solver must figure out.
    
    Returns:
        Dict containing puzzle_components and solution_context
    """
    
    extraction_prompt = f"""You are a puzzle analyzer for LATERAL THINKING PUZZLES. Your job is to extract 1-5 HIGH-QUALITY, ESSENTIAL puzzle components that are truly necessary to solve the puzzle.

**Puzzle:**
{puzzle_text}

**Solution:**
{solution}

**Difficulty:** {difficulty}

**CRITICAL REQUIREMENTS:**

1. **PRIORITIZE QUALITY OVER QUANTITY:** Generate 2-4 clues ONLY. Each clue must be absolutely essential. It is BETTER to have 2 perfect clues than 4 mediocre ones.

2. **DISTINCT & NON-OVERLAPPING:** Each component must reveal a DIFFERENT key piece of information. Do NOT create components that say the same thing in different ways.

3. **TRULY ESSENTIAL:** Only include components that are NECESSARY to understand the solution. If a component can be removed and the puzzle still makes sense, it's not essential - DO NOT INCLUDE IT.

4. **PROGRESSIVE REVELATION:** Each component should build on previous ones, revealing the solution step by step. The sequence should feel natural and logical.

**Component Count Guidelines by Difficulty:**
- Easy: 2-3 components (simple puzzles need fewer clues - aim for 2 if possible)
- Medium: 2-4 components (moderate complexity - aim for 3)
- Hard: 3-4 components (complex puzzles - only use 4 if absolutely necessary)

**IMPORTANT:** Do NOT pad your list to reach a higher number. If the puzzle can be fully explained with 2 clues, use 2 clues. Quality and essentiality are paramount.

**For EACH component, provide:**
1. The component text (a key piece of the solution)
2. An icon/keyword (a single evocative word or emoji representing this component)

**Icon/Keyword Guidelines:**
- Should be a single word or simple emoji that captures the essence
- Examples: "🎈 Balloon", "⚖️ Weight", "🎲 Choice", "💔 Sacrifice"
- Can be just text: "Balloon", "Weight", "Choice", "Sacrifice"
- Should be memorable and visually distinctive

**Response Format:**
Return ONLY valid JSON:
{{
  "puzzle_components": [
    "Component 1: [First unresolved element]",
    "Component 2: [Second unresolved element]",
    "Component 3: [Third unresolved element]"
  ],
  "solution_context": [
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5"
  ]
}}

The solution_context should contain 5-10 keywords that semantically relate to the solution.

**Example for Easy Puzzle (Hiccups):**
{{
  "puzzle_components": [
    "Why did the man ask for water if he didn't want to drink?",
    "Why did the bartender pull out a gun?",
    "Why did the man say 'thank you' and leave happy?"
  ],
  "solution_context": ["hiccups", "scare", "cure", "bartender", "water", "shock", "remedy", "surprise"]
}}

**Example for Medium Puzzle (Photography):**
{{
  "puzzle_components": [
    "What does it mean to 'shoot' someone without a weapon?",
    "Why would someone be held 'underwater' safely?",
    "How can two people have dinner together after such an event?"
  ],
  "solution_context": ["photography", "camera", "darkroom", "develop", "film", "photo", "picture", "chemical", "bath"]
}}

**Example for Hard Puzzle (Elevator):**
{{
  "puzzle_components": [
    "Why can the man go all the way down but not all the way up?",
    "What is significant about the 7th floor?",
    "What physical characteristic would explain this daily routine?"
  ],
  "solution_context": ["height", "short", "reach", "button", "elevator", "limitation", "physical", "access", "floor"]
}}

Extract the puzzle components now."""

    try:
        ai_result = await get_claude_response(extraction_prompt, temperature=0.5)
        response_text = ai_result['responseText'].strip()
        
        # Clean up JSON formatting
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '').strip()
        
        component_data = json.loads(response_text)
        
        # Validate required fields
        required_fields = ["puzzle_components", "solution_context"]
        if all(field in component_data for field in required_fields):
            # Validate we have 1-5 components
            num_components = len(component_data["puzzle_components"])
            if num_components < 1 or num_components > 5:
                raise ValueError(f"Expected 1-5 puzzle components, got {num_components}")
            
            print(f"✓ Extracted {num_components} distinct puzzle components")
            return component_data
        else:
            raise ValueError("Missing required fields in component extraction")
            
    except Exception as e:
        print(f"Error extracting components: {e}")
        raise


async def generate_daily_puzzle() -> Dict[str, Any]:
    """
    Generate a new unique daily lateral thinking puzzle using a multi-step AI pipeline.
    
    Pipeline:
    1. Generate core concept (theme, difficulty, scenario)
    2. Generate puzzle text and solution based on concept
    3. Extract 1-5 puzzle components based on the scenario
    
    Returns:
        Dict containing puzzle_text, solution, difficulty, puzzle_components, and context
    """
    db = get_database()
    
    # Get all previously used puzzles to ensure uniqueness
    previous_puzzles = []
    async for puzzle in db.puzzles.find({}, {"puzzle_text": 1, "_id": 0}):
        previous_puzzles.append(puzzle.get("puzzle_text", ""))
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            print(f"\n=== Puzzle Generation Attempt {attempt + 1}/{max_attempts} ===")
            
            # Step 1: Generate core concept
            print("Step 1: Generating core concept...")
            concept = await generate_core_concept(previous_puzzles)
            
            # Step 2: Generate puzzle and solution
            print("Step 2: Generating puzzle and solution...")
            puzzle_data = await generate_riddle_and_solution(concept)
            
            # Check if this puzzle text is unique
            if puzzle_data["puzzle_text"] in previous_puzzles:
                print(f"✗ Puzzle text not unique, retrying...")
                continue
            
            # Step 3: Extract puzzle components
            print("Step 3: Extracting puzzle components...")
            components = await extract_puzzle_components(
                puzzle_data["puzzle_text"],
                puzzle_data["solution"],
                concept["difficulty"]
            )
            
            # Assemble final puzzle data
            final_puzzle = {
                "puzzle_text": puzzle_data["puzzle_text"],
                "solution": puzzle_data["solution"],
                "puzzle_components": components["puzzle_components"],
                "solution_context": components["solution_context"],
                "difficulty": concept["difficulty"]
            }
            
            print(f"\n✓ Successfully generated complete puzzle!")
            print(f"  Difficulty: {final_puzzle['difficulty']}")
            print(f"  Components: {len(final_puzzle['puzzle_components'])}")
            
            return final_puzzle
            
        except Exception as e:
            print(f"✗ Attempt {attempt + 1} failed: {e}")
            if attempt == max_attempts - 1:
                print("All attempts failed, using fallback puzzle")
                raise
    
    # Fallback puzzle if all attempts fail
    return {
        "puzzle_text": "A man walks into a bar and asks the bartender for a glass of water. The bartender pulls out a gun and points it at the man. The man says 'thank you' and leaves without the water. What's going on?",
        "solution": "The man had hiccups. He asked for water to cure them, but the bartender, understanding the real issue, scared him with a gun to cure the hiccups instantly. The man, cured, no longer needed the water and left thankful.",
        "puzzle_components": [
            "Why did the man ask for water but not drink it?",
            "Why did the bartender use a gun instead of serving water?",
            "Why was the man thankful for being threatened?"
        ],
        "solution_context": ["hiccups", "scare", "cure", "bartender", "water", "shock", "remedy", "surprise"],
        "difficulty": "Easy"
    }

async def store_daily_puzzle(puzzle_data: Dict[str, Any], force_overwrite: bool = False) -> str:
    """
    Store the generated puzzle in the database with today's date.
    
    Args:
        puzzle_data: Dictionary containing puzzle information
        force_overwrite: If True, overwrites existing puzzle for today (for testing)
        
    Returns:
        The ID of the stored puzzle
    """
    db = get_database()
    
    # Get today's date in Pacific Time (handles PST/PDT automatically)
    now_pacific = datetime.now(PACIFIC_TZ)
    today = now_pacific.strftime("%Y-%m-%d")
    
    # Check if a puzzle already exists for today
    existing_puzzle = await db.puzzles.find_one({"date": today})
    if existing_puzzle:
        if force_overwrite:
            # Delete the existing puzzle to allow overwrite
            await db.puzzles.delete_one({"_id": existing_puzzle["_id"]})
            print(f"Force overwrite: Deleted existing puzzle for {today}")
        else:
            print(f"Puzzle already exists for {today}, skipping storage")
            return str(existing_puzzle["_id"])
    
    # Create the puzzle document
    puzzle_doc = {
        "puzzle_text": puzzle_data["puzzle_text"],
        "solution": puzzle_data["solution"],
        "puzzle_components": puzzle_data.get("puzzle_components", []),
        "solution_context": puzzle_data.get("solution_context", []),
        "difficulty": puzzle_data.get("difficulty", "Medium"),
        "date": today,
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await db.puzzles.insert_one(puzzle_doc)
    puzzle_id = str(result.inserted_id)
    
    print(f"Stored new puzzle for {today} with ID: {puzzle_id}")
    return puzzle_id

async def generate_and_store_daily_puzzle(force_overwrite: bool = False) -> Dict[str, Any]:
    """
    Main function to generate and store a new daily puzzle.
    This should be called by the scheduled job.
    
    Args:
        force_overwrite: If True, overwrites existing puzzle for today (for testing)
    
    Returns:
        Dictionary with success status and puzzle information
    """
    try:
        # Generate the puzzle
        puzzle_data = await generate_daily_puzzle()
        
        # Store it in the database
        puzzle_id = await store_daily_puzzle(puzzle_data, force_overwrite=force_overwrite)
        
        return {
            "success": True,
            "puzzle_id": puzzle_id,
            "puzzle_text": puzzle_data["puzzle_text"],
            "difficulty": puzzle_data["difficulty"],
            "puzzle_components": puzzle_data["puzzle_components"],
            "solution_context": puzzle_data["solution_context"]
        }
    except Exception as e:
        print(f"Error in generate_and_store_daily_puzzle: {e}")
        return {
            "success": False,
            "error": str(e)
        }