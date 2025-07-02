# Plan to Refactor the Session History Page

This plan is divided into two main phases: first, redesigning the UI of the individual session cards, and second, implementing the filtering and search functionality on the history page.

## Phase 1: Redesigning the `SessionCard` Component

The goal here is to make the session cards more compact and visually organized.

**1. `SessionCard.tsx` Refactoring:**
*   **Restructure Layout:** I will use a combination of Flexbox and Grid layout to organize the card's content into a header, body, and footer.
*   **Move AI Summary Button:** The "Click to view AI-powered summary" link will be moved from the footer to the header, positioned on the left side.
*   **Condense Content:**
    *   The `pain_point` will serve as the main title of the card.
    *   I will display only brief, truncated summaries for the "Primary Cause" and "Action Plan".
    *   The download and save buttons will remain in the footer but will be styled to fit the new compact design.

**2. `globals.css` Styling Updates:**
*   I will introduce new CSS classes and modify existing ones (`.session-card`, `.session-header`, etc.) to control the layout, spacing, and typography of the new card design.
*   The card will have a smaller maximum width to ensure it doesn't span the entire screen.
*   Styles will be adjusted for both light and dark modes.

## Phase 2: Implementing Filtering and Search

This will be done in the `HistoryPage.tsx` component.

**1. Add State for Filters:**
*   I will introduce state variables to manage the user's filter selections:
    *   `searchQuery` (for keyword search)
    *   `selectedMonth`
    *   `selectedYear`

**2. Create Filter UI:**
*   I will add a search input field for keyword filtering.
*   I will add dropdown menus (`<select>`) for month and year selection. The year dropdown will be dynamically populated based on the available session dates.

**3. Implement Filtering Logic:**
*   I will create a `filteredSessions` array that will be derived from the main `sessions` list.
*   This logic will apply the selected filters (date range and/or keyword) to the session data. The keyword search will check against the `pain_point`, causes, and action plan text.
*   The page will render the `filteredSessions` array, so the list updates automatically as the user applies filters.

## Visual Plan: Mermaid Diagram

Here is a Mermaid diagram illustrating the proposed new structure for a `SessionCard`:

```mermaid
graph TD
    subgraph SessionCard
        direction TB
        subgraph Header
            direction LR
            A[View AI Summary Button]
            B[Date]
        end
        subgraph Body
            direction TB
            C[Problem Statement]
            D[Brief Cause Summary]
            E[Brief Action Plan Summary]
        end
        subgraph Footer
            direction LR
            F[Download PDF Button]
            G[Save as Image Button]
        end
    end