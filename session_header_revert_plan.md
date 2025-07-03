# Plan to Revert and Update Session Header

This plan simplifies the session header implementation by using the title from the existing AI session summary instead of generating a separate header.

## 1. Revert API Changes

*   In `api/services/aiService.js`, the `generateSummaryHeader` function will be removed.
*   In `api/server.js`, the `/api/ai/summary-header` endpoint and the import for `generateSummaryHeader` will be removed.

## 2. Update Backend Logic

*   In `backend/main.py`, the `httpx` import and the `generate_summary_header` function will be removed.
*   The `create_session` function will be modified to extract the `title` from the `ai_summary` (if it exists) and save it to the `summary_header` column in the database.

## 3. Confirm Frontend Implementation

*   The frontend component `frontend/src/components/SessionCard.tsx` is already set up to display the `summary_header` field, so no changes are needed there.
*   The other UI changes (button colors and card width) will remain as they are.