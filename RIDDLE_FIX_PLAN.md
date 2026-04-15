# Daily Riddle Fix Plan

## Problem Analysis

### Root Cause
The daily riddle is not updating at midnight PST because:

1. **On-the-fly generation bypasses scheduler**: The `get_daily_riddle` endpoint in `main.py` (line 1005) generates a riddle on-demand if none exists for today. This means the first user to visit the page triggers riddle generation, not the scheduled job.

2. **Timezone handling issues**: 
   - Scheduler uses fixed UTC offset (8:00 UTC) which doesn't account for PDT
   - `riddle_generator.py` uses fixed UTC-8 offset for PST
   - Frontend uses fixed UTC-8 offset for countdown timer
   - These mismatches cause date calculation errors during PDT

3. **Scheduler may not be running**: No logs from the scheduler suggest the job might not be executing at all.

## Solution

### Phase 1: Fix Scheduler and Generation Logic
1. Add `pytz` dependency for proper timezone handling
2. Update scheduler to use `America/Los_Angeles` timezone
3. Update `riddle_generator.py` to use proper timezone
4. Remove on-the-fly generation from `get_daily_riddle` endpoint
5. Add better logging to track scheduler execution

### Phase 2: Fix Frontend Timezone Handling
1. Update frontend countdown timer to use proper timezone calculation
2. Ensure frontend fetches riddle correctly after midnight transition

### Phase 3: Testing
1. Manually trigger riddle generation to verify it works
2. Test timezone calculations
3. Verify scheduler runs at correct time

## Implementation Steps

1. ✅ Add `pytz` to requirements.txt
2. ✅ Update `scheduler.py` to use `America/Los_Angeles` timezone
3. ✅ Update `riddle_generator.py` to use `pytz` for date calculation
4. ✅ Update `main.py` `get_daily_riddle` to remove on-the-fly generation
5. ✅ Add logging to scheduler startup
6. ✅ Update frontend timezone calculation
7. ✅ Test the fix

## Files to Modify
- `Nuudle/nuudle/backend/requirements.txt`
- `Nuudle/nuudle/backend/scheduler.py`
- `Nuudle/nuudle/backend/riddle_generator.py`
- `Nuudle/nuudle/backend/main.py`
- `Nuudle/nuudle/frontend/src/app/daily-riddle/page.tsx`