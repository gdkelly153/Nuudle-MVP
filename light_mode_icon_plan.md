# Plan: Light Mode Icon Style Update

This document outlines the plan to change the background of the light mode icon to a cream color with a golden mustard border.

### 1. Goal

Modify the CSS to change the appearance of the theme switcher button for the light mode icon (the sun icon).

### 2. File to Modify

- `frontend/src/app/globals.css`

### 3. Action

Add a new CSS rule to target the `.theme-switcher` class specifically when the dark theme is active (`[data-theme='dark']`). This will ensure that only the light mode icon's appearance is changed.

### 4. Style Changes

- **`background-color`**: `#FDF9F4` (cream)
- **`border-color`**: `var(--golden-mustard-border)` (#a6814e)

### 5. Plan Diagram

```mermaid
graph TD
    A[Start] --> B{Identify Target Component: .theme-switcher};
    B --> C{Locate Styles in globals.css};
    C --> D{Analyze Theme Logic};
    D --> E{Formulate New CSS Rule};
    E --> F{Apply Changes to globals.css};
    F --> G[End];

    subgraph D
        direction TB
        D1["Icon logic: theme === 'dark' ? '☀️' : '🌙'"] --> D2["Target the sun icon (☀️)"];
        D2 --> D3["This icon is shown when the theme is 'dark'"];
    end

    subgraph E
        direction TB
        E1["background-color: #FDF9F4 (cream)"] --> E2["border-color: var(--golden-mustard-border)"];
        E2 --> E3["New rule: [data-theme='dark'] .theme-switcher"];
    end