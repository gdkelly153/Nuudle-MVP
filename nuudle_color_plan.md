# Plan: Nuudle Brand Color Implementation

This plan outlines the strategy for integrating the new, restrained color palette into the Nuudle frontend application. The goal is to create a sophisticated, focused user experience by using color strategically and consistently across both light and dark themes.

## 1. Architecture Overview

We will leverage the existing theme architecture provided by `next-themes`. The core of our work will be a refactoring of the CSS to use a new, centralized set of color variables.

A Mermaid diagram illustrating the architecture:

```mermaid
graph TD
    A[ThemeProvider] -->|sets| B(<html> data-theme attribute);
    B -->|controls| C{globals.css};
    C -->|defines| D[:root variables];
    C -->|defines| E[data-theme="dark" variables];
    D -->|styles| F[Components in Light Mode];
    E -->|styles| G[Components in Dark Mode];
```

## 2. Implementation Phases

The implementation will be broken down into the following steps:

#### **Step 1: Establish Core Color Variables**

First, we will replace the current variables in `frontend/src/app/globals.css` with the full set of Nuudle brand colors. This creates the foundation for both light and dark themes.

*   **Action:** In `frontend/src/app/globals.css`, replace the existing `:root` and `[data-theme='dark']` blocks with the new, comprehensive color definitions provided in the project brief.

#### **Step 2: Refactor Component Styles**

Next, we will systematically audit and update the CSS for all major UI components to use the new variables. This will involve finding existing selectors in `frontend/src/app/globals.css` and applying the new color rules.

*   **Buttons & Interactive Elements:**
    *   **Target Selectors:** `button`, `.btn`, `.landing-button`, `.action-button`, etc.
    *   **Styling:** Apply `var(--golden-mustard)` for backgrounds, `var(--golden-mustard-border)` for borders, and appropriate hover/focus variables.
    *   **Destructive Actions:** Target `.delete-item-button`, `.btn-destructive`, etc., and apply `var(--warm-brick)`.

*   **Typography:**
    *   **Target Selectors:** `h1`, `h2`, `h3`, `p`, `.header`, `.section-title`, etc.
    *   **Styling:** Apply `var(--text-primary)` and `var(--text-secondary)` for readability. Headers will **never** use `--golden-mustard`.
    *   **Brand Elements:** Target `.logo`, `.brand-name` and apply `var(--golden-mustard)`.

*   **Forms & Inputs:**
    *   **Target Selectors:** `input`, `textarea`, `select`.
    *   **Styling:** Use `var(--bg-secondary)` for the background and `var(--border-light)` for the border. The focus state will be highlighted using `var(--golden-mustard)` for the border and `var(--golden-mustard-focus)` for the box-shadow.
    *   **Important Containers:** Target `.problem-input`, `.action-container` and apply a `1px solid var(--golden-mustard)` border.

*   **Layout & Containers:**
    *   **Target Selectors:** `body`, `.card`, `.container`, `.modal`.
    *   **Styling:** Use `var(--bg-primary)` for the main page background and `var(--bg-secondary)` for elevated surfaces like cards and modals. Borders will use `var(--border-light)` or `var(--border-medium)` for dividers.

#### **Step 3: Purge Hardcoded Colors**

A critical part of this refactor is to eliminate all hardcoded color values from the stylesheet to ensure the theme is applied consistently.

*   **Action:** Perform a search within `frontend/src/app/globals.css` for all instances of `#` followed by hex codes (e.g., `#ccc`, `#007bff`, `#28a745`) and replace them with the appropriate CSS variables from our new system.

## 3. Accessibility Considerations

To ensure the platform is usable and comfortable for everyone, we must verify that our new color palette meets accessibility standards.

*   **Action:** After implementation, we will use a contrast checking tool to validate that all text and UI elements meet at least WCAG AA contrast ratios against their backgrounds in both light and dark modes.