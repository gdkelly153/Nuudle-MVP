"""
Daily Riddle Generation Service
Generates unique riddles using AI with varying difficulty and categories
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

async def generate_core_concept(previous_riddles: List[str]) -> Dict[str, Any]:
    """
    Step 1: Generate a unique, logical core concept for a POETIC RIDDLE.
    This focuses on brainstorming a single object/concept and its paradoxical properties.
    
    Returns:
        Dict containing theme, difficulty, answer, and properties
    """
    concept_prompt = f"""You are a creative riddle conceptualizer. Your job is to create a concept for a POETIC RIDDLE.

**What is a Poetic Riddle?**
A poetic riddle describes a single, familiar object or concept using metaphorical language. The answer is always something ordinary that people know.

**Difficulty Levels:**
- Easy: Simple wordplay or obvious metaphors (e.g., "What has an eye but cannot see?" → A needle)
- Medium: Requires some lateral thinking (e.g., "I have a neck but no head" → A bottle)
- Hard: Complex metaphors requiring deeper thought (e.g., "I am taken from a mine and shut in a wooden case" → Pencil lead)

**Your Task:**
1. Choose ONE difficulty level (aim for variety: Easy, Medium, or Hard)
2. Select a SINGLE, FAMILIAR answer from one of these categories:
   - Common household objects (needle, key, mirror, clock, candle, etc.)
   - Natural phenomena (shadow, echo, wind, rain, fire, etc.)
   - Abstract concepts (time, silence, secret, memory, etc.)
   - Body parts or features (breath, voice, footsteps, etc.)

3. Identify 2-3 PARADOXICAL or NON-OBVIOUS properties of that answer that are:
   - Factually true and verifiable
   - Interesting or seemingly contradictory
   - Suitable for metaphorical description

**CRITICAL RULES:**

1. **The Answer Must Be a SINGLE Thing:** Not a scenario, not a story, just one object/concept.
2. **NO Reality-Bending:** No time loops, dreams, impossible physics, or alternate realities.
3. **Properties Must Be TRUE:** Every property you list must be factually accurate.
4. **Avoid Recent Answers:** Don't repeat these recent riddles:
{chr(10).join([f"     - {r[:80]}..." for r in previous_riddles[-15:]]) if previous_riddles else "     (No previous riddles yet)"}

**Response Format:**
Return ONLY valid JSON:
{{
  "theme": "Brief description (1 sentence)",
  "difficulty": "Easy/Medium/Hard",
  "answer": "The single object or concept",
  "properties": ["property1", "property2", "property3"],
  "logical_explanation": "Why these properties are true and interesting"
}}

**Examples:**

Easy:
{{
  "theme": "An object with a body part name that doesn't function like that body part",
  "difficulty": "Easy",
  "answer": "needle",
  "properties": ["has an 'eye' but cannot see", "is sharp but helps create soft things", "is small but essential for large tasks"],
  "logical_explanation": "A needle has a hole called an 'eye' for threading, which creates a simple wordplay opportunity"
}}

Medium:
{{
  "theme": "A natural phenomenon that follows you but isn't alive",
  "difficulty": "Medium",
  "answer": "shadow",
  "properties": ["mimics your movements but has no will", "is born from light but flees from it", "has no weight but can be seen"],
  "logical_explanation": "A shadow's paradoxical relationship with light and its mimicry of movement create interesting metaphorical opportunities"
}}

Hard:
{{
  "theme": "An abstract concept that everyone experiences but cannot touch",
  "difficulty": "Hard",
  "answer": "silence",
  "properties": ["speaks volumes without making a sound", "can be deafening yet is the absence of noise", "is broken by being named"],
  "logical_explanation": "Silence has paradoxical qualities that make it philosophically interesting and suitable for complex metaphors"
}}

Generate a completely new, unique concept now."""

    try:
        ai_result = await get_claude_response(concept_prompt, temperature=0.9)
        response_text = ai_result['responseText'].strip()
        
        # Clean and parse JSON
        cleaned_text = clean_json_response(response_text)
        concept_data = json.loads(cleaned_text)
        
        # Validate required fields
        required_fields = ["theme", "difficulty", "answer", "properties", "logical_explanation"]
        if all(field in concept_data for field in required_fields):
            print(f"✓ Generated concept: {concept_data['answer']} - {concept_data['theme'][:60]}...")
            return concept_data
        else:
            raise ValueError("Missing required fields in concept generation")
            
    except Exception as e:
        print(f"Error generating concept: {e}")
        raise


async def generate_riddle_and_solution(concept: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 2: Generate a POETIC RIDDLE based on the approved concept.
    This transforms the properties into metaphorical clues.
    
    Returns:
        Dict containing riddle_text and solution
    """
    riddle_prompt = f"""You are a master riddle writer. You have been given an approved concept for a POETIC RIDDLE. Your job is to craft the riddle text and solution.

**Approved Concept:**
- Answer: {concept['answer']}
- Difficulty: {concept['difficulty']}
- Properties: {', '.join(concept['properties'])}
- Logic: {concept['logical_explanation']}

**THE POET'S CREATIVE PROCESS:**

Your task is to transform the properties into a short, elegant, metaphorical riddle.

**Step 1: Transform Properties into Metaphors**
Take each property and express it poetically:
- Instead of "has an eye but cannot see" → "I have an eye, yet I am blind"
- Instead of "mimics movements" → "I follow your every step, yet I have no will of my own"
- Instead of "is born from light" → "Light gives me life, yet I flee from its embrace"

**Step 2: Weave into a Riddle**
Combine the metaphors into a short, elegant riddle (1-4 lines).
- Keep it concise and poetic
- Every word must be a clue
- End with "What am I?" or a similar question

**Step 3: Write the Solution**
Provide a clear, concise solution that:
- States the answer directly
- Explains how each metaphor connects to the answer

**CRITICAL RULES:**

1. **BE BRIEF:** Poetic riddles are SHORT (1-4 lines maximum)
2. **BE METAPHORICAL:** Never describe the answer literally
3. **NO CONTRADICTIONS:** Every statement must be factually true about the answer
4. **NO FILLER:** Every word must serve as a clue

**Response Format:**
You MUST return ONLY valid JSON:
{{
  "riddle_text": "Your short, poetic riddle here",
  "solution": "Your clear solution here"
}}

**Examples:**

Easy (Needle):
{{
  "riddle_text": "What has an eye but cannot see?",
  "solution": "A needle. The hole in a needle is called an 'eye', but it cannot see like a real eye."
}}

Medium (Shadow):
{{
  "riddle_text": "I follow you by day, mimic your every move, yet I have no will of my own. Light gives me life, yet I flee from its direct gaze. What am I?",
  "solution": "A shadow. A shadow follows you and mimics your movements, is created by light, but disappears when you face the light source directly."
}}

Hard (Silence):
{{
  "riddle_text": "I speak volumes without uttering a sound. I can be deafening, yet I am the absence of all noise. Speak my name and I am broken. What am I?",
  "solution": "Silence. Silence can be powerful and meaningful, can feel overwhelming ('deafening'), and is broken the moment you say the word 'silence'."
}}

Generate your riddle now. Remember: SHORT, POETIC, METAPHORICAL. Return ONLY the JSON object."""

    try:
        ai_result = await get_claude_response(riddle_prompt, temperature=0.7)
        response_text = ai_result['responseText'].strip()
        
        # Clean and parse JSON
        cleaned_text = clean_json_response(response_text)
        riddle_data = json.loads(cleaned_text)
        
        # Validate required fields
        required_fields = ["riddle_text", "solution"]
        if all(field in riddle_data for field in required_fields):
            print(f"✓ Generated riddle: {riddle_data['riddle_text'][:60]}...")
            return riddle_data
        else:
            raise ValueError("Missing required fields in riddle generation")
            
    except Exception as e:
        print(f"Error generating riddle: {e}")
        raise


async def extract_solution_components(riddle_text: str, solution: str, difficulty: str) -> Dict[str, Any]:
    """
    Step 3: Extract the single answer for a POETIC RIDDLE.
    This creates a simple single-component solution array.
    
    Returns:
        Dict containing solution_components (single item) and solution_context
    """
    
    extraction_prompt = f"""You are a riddle analyzer for POETIC RIDDLES. Your job is to extract the answer and related keywords.

**Riddle:**
{riddle_text}

**Solution:**
{solution}

**Your Task:**
Extract the answer from the solution and identify keywords that relate to it.

**Response Format:**
Return ONLY valid JSON:
{{
  "answer": "The single word or short phrase answer",
  "solution_context": [
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5"
  ]
}}

The solution_context should contain 5-10 keywords that semantically relate to the answer.

Extract the answer and keywords now."""

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
        required_fields = ["answer", "solution_context"]
        if all(field in component_data for field in required_fields):
            # Convert to single-component format
            result = {
                "solution_components": [f"The answer is {component_data['answer']}"],
                "solution_context": component_data["solution_context"]
            }
            print(f"✓ Extracted answer: {component_data['answer']}")
            return result
        else:
            raise ValueError("Missing required fields in component extraction")
            
    except Exception as e:
        print(f"Error extracting components: {e}")
        raise


async def generate_daily_riddle() -> Dict[str, Any]:
    """
    Generate a new unique daily riddle using a multi-step AI pipeline.
    
    Pipeline:
    1. Generate core concept (theme, difficulty)
    2. Generate riddle text and solution based on concept
    3. Extract solution components based on difficulty
    
    Returns:
        Dict containing riddle_text, solution, difficulty, components, and context
    """
    db = get_database()
    
    # Get all previously used riddles to ensure uniqueness
    previous_riddles = []
    async for riddle in db.riddles.find({}, {"riddle_text": 1, "_id": 0}):
        previous_riddles.append(riddle.get("riddle_text", ""))
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            print(f"\n=== Riddle Generation Attempt {attempt + 1}/{max_attempts} ===")
            
            # Step 1: Generate core concept
            print("Step 1: Generating core concept...")
            concept = await generate_core_concept(previous_riddles)
            
            # Step 2: Generate riddle and solution
            print("Step 2: Generating riddle and solution...")
            riddle_data = await generate_riddle_and_solution(concept)
            
            # Check if this riddle text is unique
            if riddle_data["riddle_text"] in previous_riddles:
                print(f"✗ Riddle text not unique, retrying...")
                continue
            
            # Step 3: Extract solution components
            print("Step 3: Extracting solution components...")
            components = await extract_solution_components(
                riddle_data["riddle_text"],
                riddle_data["solution"],
                concept["difficulty"]
            )
            
            # Assemble final riddle data
            final_riddle = {
                "riddle_text": riddle_data["riddle_text"],
                "solution": riddle_data["solution"],
                "solution_components": components["solution_components"],
                "solution_context": components["solution_context"],
                "difficulty": concept["difficulty"]
            }
            
            print(f"\n✓ Successfully generated complete riddle!")
            print(f"  Difficulty: {final_riddle['difficulty']}")
            print(f"  Components: {len(final_riddle['solution_components'])}")
            
            return final_riddle
            
        except Exception as e:
            print(f"✗ Attempt {attempt + 1} failed: {e}")
            if attempt == max_attempts - 1:
                print("All attempts failed, using fallback riddle")
                raise
    
    # Fallback riddle if all attempts fail
    return {
        "riddle_text": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        "solution": "An echo. It repeats sound without having a mouth, and exists only when sound waves bounce back.",
        "solution_components": [
            "The answer is an echo"
        ],
        "solution_context": ["sound", "reflection", "bounce", "repeat", "voice", "cave", "canyon", "echo"],
        "difficulty": "Medium"
    }

async def store_daily_riddle(riddle_data: Dict[str, Any], force_overwrite: bool = False) -> str:
    """
    Store the generated riddle in the database with today's date.
    
    Args:
        riddle_data: Dictionary containing riddle information
        force_overwrite: If True, overwrites existing riddle for today (for testing)
        
    Returns:
        The ID of the stored riddle
    """
    db = get_database()
    
    # Get today's date in Pacific Time (handles PST/PDT automatically)
    now_pacific = datetime.now(PACIFIC_TZ)
    today = now_pacific.strftime("%Y-%m-%d")
    
    # Check if a riddle already exists for today
    existing_riddle = await db.riddles.find_one({"date": today})
    if existing_riddle:
        if force_overwrite:
            # Delete the existing riddle to allow overwrite
            await db.riddles.delete_one({"_id": existing_riddle["_id"]})
            print(f"Force overwrite: Deleted existing riddle for {today}")
        else:
            print(f"Riddle already exists for {today}, skipping storage")
            return str(existing_riddle["_id"])
    
    # Create the riddle document
    riddle_doc = {
        "riddle_text": riddle_data["riddle_text"],
        "solution": riddle_data["solution"],
        "solution_components": riddle_data.get("solution_components", []),
        "solution_context": riddle_data.get("solution_context", []),
        "difficulty": riddle_data.get("difficulty", "Medium"),
        "date": today,
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await db.riddles.insert_one(riddle_doc)
    riddle_id = str(result.inserted_id)
    
    print(f"Stored new riddle for {today} with ID: {riddle_id}")
    return riddle_id

async def generate_and_store_daily_riddle(force_overwrite: bool = False) -> Dict[str, Any]:
    """
    Main function to generate and store a new daily riddle.
    This should be called by the scheduled job.
    
    Args:
        force_overwrite: If True, overwrites existing riddle for today (for testing)
    
    Returns:
        Dictionary with success status and riddle information
    """
    try:
        # Generate the riddle
        riddle_data = await generate_daily_riddle()
        
        # Store it in the database
        riddle_id = await store_daily_riddle(riddle_data, force_overwrite=force_overwrite)
        
        return {
            "success": True,
            "riddle_id": riddle_id,
            "riddle_text": riddle_data["riddle_text"],
            "difficulty": riddle_data["difficulty"],
            "solution_components": riddle_data["solution_components"],
            "solution_context": riddle_data["solution_context"]
        }
    except Exception as e:
        print(f"Error in generate_and_store_daily_riddle: {e}")
        return {
            "success": False,
            "error": str(e)
        }