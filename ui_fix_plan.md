# Plan to Fix UI Issues

I will make the following changes to align the button text and update the brain icon size for a more consistent user experience.

## 1. Correct Button and Icon Alignment

The vertical misalignment between the "Help me Nuudle" and "Begin" buttons is caused by the `items-baseline` class, which aligns content based on the text's baseline. To fix this, I will:

*   **File to Modify**: `frontend/src/components/AIComponents.tsx`
*   **Action**: In the `HelpMeNuudleButton` and `AIAssistButton` components, I will replace `items-baseline` with `items-center`. This will vertically align the brain icon and button text, ensuring they are perfectly centered.

## 2. Standardize Brain Icon Size

To create a more visually consistent UI, I will update the size of the brain icon across all components.

*   **File to Modify**: `frontend/src/components/AIComponents.tsx`
*   **Action**: I will change the brain icon's class from `w-2 h-2` to `w-4 h-4` in the following components:
    *   `HelpMeNuudleButton`
    *   `AIAssistButton`
    *   `AIResponseCard`

This will make the brain icon's size consistent with other icons, such as the loading spinner.