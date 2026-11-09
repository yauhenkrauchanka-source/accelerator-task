# Prefer toSorted For Immutable Sorting When Supported

If the runtime target supports it cleanly, `toSorted()` is clearer than cloning and mutating with `sort()`.

Less clear:

```ts
const sortedInvoices = [...invoices].sort((left, right) =>
	left.createdAt.localeCompare(right.createdAt),
);
```

Clearer when available:

```ts
const sortedInvoices = invoices.toSorted((left, right) =>
	left.createdAt.localeCompare(right.createdAt),
);
```

Use this only when:

- your browser/runtime targets support it directly or via your normal transpilation path
- it improves clarity instead of surprising the team
