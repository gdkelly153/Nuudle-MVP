# Plan: Add Theme Switcher to Nuudle

This document outlines the plan to add a theme switcher to the Nuudle application, allowing users to toggle between light and dark modes.

## 1. Install `next-themes`

First, we'll add the necessary package to the frontend application. This library simplifies theme management in Next.js.

## 2. Create a Theme Provider

A new component will be created at `frontend/src/components/ThemeProvider.tsx`. This component will:
- Wrap the entire application.
- Use `next-themes` to provide theme-switching logic.
- Be configured to set **dark mode as the default theme**.

## 3. Create a Theme Switcher Component

A new UI component will be created at `frontend/src/components/ThemeSwitcher.tsx`. This will be a simple button that allows users to toggle between light and dark modes.

## 4. Integrate into the Main Layout

The main layout file, `frontend/src/app/layout.tsx`, will be updated to:
- Include the `ThemeProvider` to wrap all pages.
- Place the `ThemeSwitcher` in the top-right corner of the screen.

## 5. Update CSS

The global stylesheet, `frontend/src/app/globals.css`, will be modified to use a `[data-theme='dark']` selector instead of the `@media (prefers-color-scheme: dark)` media query. This change is necessary for `next-themes` to dynamically control the theme.

## Diagram

```mermaid
graph TD
    A[Start] --> B{1. Install next-themes};
    B --> C{2. Create ThemeProvider (default: dark)};
    C --> D{3. Create ThemeSwitcher};
    D --> E{4. Update Layout};
    E --> F{5. Update CSS};
    F --> G[Finish];