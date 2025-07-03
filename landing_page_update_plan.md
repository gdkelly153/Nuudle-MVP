# Landing Page Placeholder Text Update Plan

This document outlines the plan to update the placeholder text on the landing page.

## 1. Objective

The goal is to change the placeholder text in the text box on the landing page from "What problem would you like to work through today?" to "Hi shannon.".

## 2. File to be Modified

*   `frontend/src/app/SessionWizard.tsx`

## 3. Plan

1.  **Locate the placeholder text:** The placeholder text is located in the `textarea` element within the `SessionWizard` component.
2.  **Modify the `placeholder` attribute:** Change the value of the `placeholder` attribute to "Hi shannon.".

## 4. Diagram

```mermaid
graph TD
    A[Start] --> B{Locate placeholder text};
    B --> C[frontend/src/app/SessionWizard.tsx];
    C --> D{Update placeholder attribute};
    D --> E[Change text to "Hi shannon."];
    E --> F[End];