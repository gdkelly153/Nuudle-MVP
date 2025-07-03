# Plan to Fix Light Mode UI Inconsistencies in Session History

This document outlines the plan to correct the color and styling issues on the Session History page's light mode to ensure it aligns with the application's established brand guidelines. The necessary changes will be applied to `frontend/src/app/globals.css`.

## 1. Correct Session Card Styling

The session cards will be updated to use the correct background colors and hover effects as defined in the color strategy.

-   **Card Body and Borders:**
    -   Update `.session-card-compact` to use the theme's border variables.
    -   Update the hover state (`.session-card-compact:hover`) to use `--golden-mustard` for the border and `--golden-mustard-focus` for the box-shadow. This will resolve the incorrect blue outline on hover.
-   **Card Header and Footer:**
    -   Modify `.session-card-header` and `.session-card-footer` to use the primary background color (`--bg-primary`) instead of a hardcoded value.
    -   Update their borders to use `--border-light`.

## 2. Unify Button Colors

The action buttons within the session card currently use incorrect colors (blue and green). They will be updated to match the primary interactive color, `--golden-mustard`.

-   **View, Download, and Image Buttons:**
    -   The `background-color`, `border-color`, and `color` for the following classes will be changed to align with the brand's "mustard gold" theme:
        -   `.view-summary-button-compact`
        -   `.download-button-compact`
        -   `.image-button-compact`
    -   The `:hover` states for these buttons will also be updated to use the corresponding hover variables (`--golden-mustard-hover`).

## Visual Plan

This diagram illustrates the components and styles that will be modified:

```mermaid
graph TD
    subgraph "Component Structure"
        A[HistoryPage] --> B[SessionCard]
    end

    subgraph "Styling in globals.css"
        B --> C[".session-card-compact"]
        C --> D["Card Body & Hover State"]
        C --> E["Card Header & Footer"]
        C --> F["Action Buttons"]
    end

    subgraph "Specific Changes"
        D --> G["border-color: var(--golden-mustard)"]
        D --> H["box-shadow: var(--golden-mustard-focus)"]
        E --> I["background-color: var(--bg-primary)"]
        F --> J["background-color: var(--golden-mustard)"]
    end

    style A fill:#fdf9f4,stroke:#333
    style B fill:#fdf9f4,stroke:#333
    style C fill:#ffffff,stroke:#c6a55f
    style D fill:#ffffff,stroke:#333
    style E fill:#ffffff,stroke:#333
    style F fill:#ffffff,stroke:#333
    style G fill:#c6a55f,color:#fff
    style H fill:#c6a55f,color:#fff
    style I fill:#c6a55f,color:#fff
    style J fill:#c6a55f,color:#fff