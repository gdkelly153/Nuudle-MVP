# UI Fix Plan: Brain Icon Overlay

**Goal:** Ensure the brain icon renders as an overlay on the button, not inline with the text.

**Problem Analysis:**
The current JSX in `AIComponents.tsx` correctly applies `relative` positioning to the `<button>` and `absolute` positioning to the `<Brain>` icon. However, the UI does not reflect this, suggesting a browser rendering issue, possibly related to flexbox behavior or caching.

**Strategy:**
1.  **Isolate Text Content:** Wrap the text content inside the `HelpMeNuudleButton` and `AIAssistButton` components in a `<span>` element. This explicitly separates the text from the absolutely positioned icon in the document flow, which can resolve subtle rendering conflicts.

2.  **Verification:** After the code is updated, the user will perform a hard refresh (Cmd+Shift+R or Ctrl+Shift+R) in the browser to bypass any cached assets and verify the icon is correctly positioned as an overlay.

**Example Change (`HelpMeNuudleButton`):**

```diff
--- a/frontend/src/components/AIComponents.tsx
+++ b/frontend/src/components/AIComponents.tsx
@@ -54,7 +54,7 @@
           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
           AI is thinking...
         </>
       ) : (
-        "Help me Nuudle"
+        <span>Help me Nuudle</span>
       )}
     </button>
   );