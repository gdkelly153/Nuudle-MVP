"""
Scheduler Service for Daily Riddle Generation
Runs scheduled tasks at specific times (midnight PST/PDT for riddle generation)
"""
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

# Import the riddle and puzzle generators
try:
    from backend.riddle_generator import generate_and_store_daily_riddle
    from backend.puzzle_generator import generate_and_store_daily_puzzle
except ImportError:
    from riddle_generator import generate_and_store_daily_riddle
    from puzzle_generator import generate_and_store_daily_puzzle

# Create scheduler instance
scheduler = AsyncIOScheduler()

# Define Pacific timezone
PACIFIC_TZ = pytz.timezone('America/Los_Angeles')

async def daily_content_job():
    """
    Job that runs daily at midnight PST to generate and store new daily content.
    Generates both a daily riddle and a daily puzzle.
    """
    print(f"[{datetime.now()}] Running daily content generation job...")
    
    # Generate daily riddle
    try:
        riddle_result = await generate_and_store_daily_riddle()
        
        if riddle_result["success"]:
            print(f"✓ Successfully generated daily riddle:")
            print(f"  - ID: {riddle_result['riddle_id']}")
            print(f"  - Difficulty: {riddle_result['difficulty']}")
            print(f"  - Text: {riddle_result['riddle_text'][:100]}...")
        else:
            print(f"✗ Failed to generate daily riddle: {riddle_result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error in daily riddle generation: {e}")
    
    # Generate daily puzzle
    try:
        puzzle_result = await generate_and_store_daily_puzzle()
        
        if puzzle_result["success"]:
            print(f"✓ Successfully generated daily puzzle:")
            print(f"  - ID: {puzzle_result['puzzle_id']}")
            print(f"  - Difficulty: {puzzle_result['difficulty']}")
            print(f"  - Text: {puzzle_result['puzzle_text'][:100]}...")
        else:
            print(f"✗ Failed to generate daily puzzle: {puzzle_result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error in daily puzzle generation: {e}")

def start_scheduler():
    """
    Start the scheduler with the daily content job.
    Runs at midnight Pacific Time (automatically handles PST/PDT transitions).
    Generates both daily riddles and daily puzzles.
    """
    # Start the scheduler first
    scheduler.start()
    
    # Schedule the job to run at midnight Pacific Time
    # This automatically handles PST (UTC-8) and PDT (UTC-7) transitions
    job = scheduler.add_job(
        daily_content_job,
        trigger=CronTrigger(hour=0, minute=0, timezone=PACIFIC_TZ),
        id='daily_content_generation',
        name='Generate Daily Content at Midnight Pacific Time',
        replace_existing=True
    )
    
    # Log next run time
    if job.next_run_time:
        next_run_pacific = job.next_run_time.astimezone(PACIFIC_TZ)
        print(f"✓ Scheduler started. Daily content will be generated at midnight Pacific Time.")
        print(f"  Next scheduled run: {next_run_pacific.strftime('%Y-%m-%d %I:%M:%S %p %Z')}")
    else:
        print(f"✓ Scheduler started. Daily content job scheduled for midnight Pacific Time.")

def stop_scheduler():
    """
    Stop the scheduler gracefully.
    """
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped.")

async def generate_riddle_now(force_overwrite: bool = True):
    """
    Utility function to manually trigger riddle generation.
    Useful for testing or manual generation.
    
    Args:
        force_overwrite: If True, overwrites existing riddle for today (default: True for manual generation)
    """
    print(f"Manually triggering riddle generation (force_overwrite={force_overwrite})...")
    
    try:
        result = await generate_and_store_daily_riddle(force_overwrite=force_overwrite)
        
        if result["success"]:
            print(f"✓ Successfully generated riddle:")
            print(f"  - ID: {result['riddle_id']}")
            print(f"  - Difficulty: {result['difficulty']}")
            print(f"  - Components: {len(result.get('solution_components', []))}")
            print(f"  - Text: {result['riddle_text'][:100]}...")
        else:
            print(f"✗ Failed to generate riddle: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error in manual riddle generation: {e}")
        raise

async def generate_puzzle_now(force_overwrite: bool = True):
    """
    Utility function to manually trigger puzzle generation.
    Useful for testing or manual generation.
    
    Args:
        force_overwrite: If True, overwrites existing puzzle for today (default: True for manual generation)
    """
    print(f"Manually triggering puzzle generation (force_overwrite={force_overwrite})...")
    
    try:
        result = await generate_and_store_daily_puzzle(force_overwrite=force_overwrite)
        
        if result["success"]:
            print(f"✓ Successfully generated puzzle:")
            print(f"  - ID: {result['puzzle_id']}")
            print(f"  - Difficulty: {result['difficulty']}")
            print(f"  - Text: {result['puzzle_text'][:100]}...")
        else:
            print(f"✗ Failed to generate puzzle: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error in manual puzzle generation: {e}")
        raise