import asyncio
import sys
import os

# Add the parent directory to the path so we can import from the root ai_service
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from ai_service import (
    get_next_cause_analysis_question,
    evaluate_root_cause_depth,
    generate_action_options as async_generate_action_options,
    refine_action as async_refine_action,
    validate_problem_statement,
    analyze_self_awareness
)

class AIService:
    """
    Service wrapper for AI functionality to bridge async/sync gap for Flask routes
    """
    
    async def generate_action_options(self, cause: str, is_contribution: bool, user_responses: list) -> list:
        """Generate action options for a given cause"""
        return await async_generate_action_options(cause, is_contribution, user_responses)
    
    async def refine_action(self, initial_action: str, cause: str, user_feedback: str) -> str:
        """Refine an action based on user feedback"""
        return await async_refine_action(initial_action, cause, user_feedback)
    
    async def get_next_cause_question(self, cause: str, history: list, pain_point: str, regenerate: bool = False) -> dict:
        """Get the next question in the adaptive cause analysis flow"""
        return await get_next_cause_analysis_question(cause, history, pain_point, regenerate)
    
    async def evaluate_cause_depth(self, cause_text: str, user_response: str = None) -> dict:
        """Evaluate how close a cause is to being a root cause"""
        return await evaluate_root_cause_depth(cause_text, user_response)
    
    async def validate_problem(self, problem_statement: str) -> dict:
        """Validate a problem statement using AI"""
        return await validate_problem_statement(problem_statement)
    
    async def analyze_user_self_awareness(self, causes: list) -> dict:
        """Analyze if user demonstrates self-awareness in their causes"""
        return await analyze_self_awareness(causes)

# Create a global instance for use in routes
ai_service_instance = AIService()

def run_async(coro):
    """Helper function to run async functions from sync context"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If there's already a running loop, we need to use a different approach
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)