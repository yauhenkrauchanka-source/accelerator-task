# Prefer Explicit Conditional Rendering

Prefer explicit conditional rendering over ambiguous `&&` chains when the hidden value can be a valid renderable value.

Risky:

```tsx
return <div>{invoiceCount && <Badge>{invoiceCount}</Badge>}</div>;
```

Safer:

```tsx
return <div>{invoiceCount > 0 ? <Badge>{invoiceCount}</Badge> : null}</div>;
```

Why it matters:

- avoids accidentally rendering `0`
- makes the condition clearer in review
