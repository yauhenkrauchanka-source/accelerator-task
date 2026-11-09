# Return Early

Prefer early returns to reduce nesting and clarify fast paths.

Bad:

```ts
function getRetryLabel(invoice: Invoice) {
	if (invoice.status === "failed") {
		if (invoice.retryable) {
			return "Retry invoice";
		}
	}

	return "Unavailable";
}
```

Better:

```ts
function getRetryLabel(invoice: Invoice) {
	if (invoice.status !== "failed") {
		return "Unavailable";
	}

	if (!invoice.retryable) {
		return "Unavailable";
	}

	return "Retry invoice";
}
```

Why it matters:

- clearer control flow
- easier to refactor and review
