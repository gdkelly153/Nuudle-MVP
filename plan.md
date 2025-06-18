# Nuudle MVP Plan

## 1. Project Setup:
*   Create a new directory for the project.
*   Initialize a Next.js frontend with plain CSS.
*   Initialize a FastAPI backend.
*   Initialize SQLite database.

## 2. Backend Development (FastAPI):
*   Define the data model for a session (pain_point, whys, action_plan).
*   Implement the POST /api/sessions endpoint to save session data to the SQLite database.
*   Implement the GET /api/sessions endpoint to retrieve all sessions from the database.

## 3. Frontend Development (Next.js):
*   Create the SessionWizard component with input fields for pain_point, whys (3 fields), and action_plan.
*   Implement form state management and navigation within the SessionWizard component.
*   Implement the API call to POST /api/sessions on form submission.
*   Create the HistoryPage component to fetch data from GET /api/sessions on load.
*   Create the SessionCard component to display session data.
*   Implement the display of the list of SessionCard components in the HistoryPage.

## 4. Database Integration (SQLite):
*   Create the SQLite database file (nuudle.db).
*   Define the sessions table schema.
*   Implement database interactions in the FastAPI backend.

## 5. Testing:
*   Test the API endpoints using a tool like curl or Postman.
*   Test the frontend components by manually creating and reviewing sessions.

## 6. Deployment (Optional):
*   If time permits, deploy the application to a platform like Vercel or Netlify.

## Mermaid Diagram:

```mermaid
graph TD
    A[Project Setup] --> B(Backend Development);
    A --> C(Frontend Development);
    B --> D(Database Integration);
    C --> D;
    D --> E(Testing);
    E --> F(Deployment);