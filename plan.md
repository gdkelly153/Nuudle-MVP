### Plan to Update the UI Text

1.  **Modify Step 1 Text:** I will separate the introductory text in Step 1 into two distinct paragraphs to improve readability.
2.  **Capitalize Labels:** I will capitalize the words "Cause" and "Assumption" in the input field labels for both Step 1 and Step 3 to ensure consistency.

Here is a diagram illustrating the change to the text block:

```mermaid
graph TD
    subgraph Before
        A["<label>We live in a causal universe... an assumption is something believed to be true without evidence.</label>"]
    end
    subgraph After
        B["<label>"] --> C["<p>We live in a causal universe. Every effect has a cause that precedes it. Your problem is the effect.</p>"]
        B --> D["<p>List up to five causes that you think could be contributing to your problem...</p>"]
    end
    A --> B
```

All changes will be applied to the `frontend/src/app/page.tsx` file.