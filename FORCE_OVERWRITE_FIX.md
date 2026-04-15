# Force Overwrite Fix for Daily Riddle Testing

## Problem
The daily riddle system was blocking the generation of new multi-part riddles for testing because:
1. The `store_daily_riddle()` function checked if a riddle already existed for today's date
2. If a riddle existed, it would skip storage and return the old riddle's ID
3. This meant the new, properly formatted multi-part riddle was generated but never saved to the database
4. The old riddle (without components) remained in the database, causing the frontend to never display component progress

## Solution
Implemented a `force_overwrite` parameter that allows manual riddle generation to overwrite existing riddles while preserving production rules:

### Changes Made

#### 1. `riddle_generator.py` - `store_daily_riddle()` function
- Added `force_overwrite: bool = False` parameter
- When `force_overwrite=True`, deletes the existing riddle before inserting the new one
- When `force_overwrite=False` (default), preserves the original behavior (skip if exists)

#### 2. `riddle_generator.py` - `generate_and_store_daily_riddle()` function
- Added `force_overwrite: bool = False` parameter
- Passes the parameter through to `store_daily_riddle()`

#### 3. `scheduler.py` - `generate_riddle_now()` function
- Added `force_overwrite: bool = True` parameter (defaults to True for manual generation)
- Enhanced logging to show component count and force overwrite status
- Directly calls `generate_and_store_daily_riddle()` with the force_overwrite flag

### How It Works

**For Production (Scheduled Generation):**
- The scheduled job at midnight calls `daily_riddle_job()`
- This calls `generate_and_store_daily_riddle()` without parameters
- `force_overwrite` defaults to `False`
- Existing riddles are preserved (one per day rule maintained)

**For Testing (Manual Generation):**
- The frontend "Generate New Multi-Part Riddle" button calls `/api/v1/riddles/generate-now`
- This calls `generate_riddle_now()` which defaults `force_overwrite=True`
- The existing riddle is deleted before the new one is inserted
- Allows testing of new multi-part riddles without waiting for midnight

### Benefits
1. ✅ Preserves production integrity (one riddle per day for users)
2. ✅ Enables testing and development (can regenerate riddles on demand)
3. ✅ Clear separation of concerns (scheduled vs manual generation)
4. ✅ Maintains backward compatibility (default behavior unchanged)

### Testing Results
From terminal logs, the system now correctly:
- Deletes existing riddles when force_overwrite=True
- Stores new multi-part riddles with components
- Tracks component progress (1/4, 2/4, 3/4, 4/4)
- Marks sessions as solved when complete

## Next Steps
The user should now:
1. Click "Generate New Multi-Part Riddle" to create a fresh riddle with the bicycle/deck of cards scenario
2. Test the question "Are the 52 bicycles a deck of cards?" to verify it responds "Yes"
3. Verify the progress bar displays and updates correctly as components are solved