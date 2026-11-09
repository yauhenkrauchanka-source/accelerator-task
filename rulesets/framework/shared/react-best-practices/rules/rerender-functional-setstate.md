# Prefer Functional setState Updates For Derived Next State

When the next state depends on the previous state, use the functional form.

Bad:

```tsx
setExpandedRows([...expandedRows, rowId]);
```

Better:

```tsx
setExpandedRows((current) => [...current, rowId]);
```

Why it matters:

- avoids stale closure bugs
- keeps callbacks stable without forcing extra dependencies
