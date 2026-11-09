# Combine Array Iterations When The Dataset Is Hot Or Large

Avoid stacking multiple passes over the same array when one pass is clear and sufficient.

Bad:

```ts
const overdueInvoiceIds = invoices
	.filter((invoice) => invoice.status === "overdue")
	.map((invoice) => invoice.id);
```

Better:

```ts
const overdueInvoiceIds: string[] = [];

for (const invoice of invoices) {
	if (invoice.status === "overdue") {
		overdueInvoiceIds.push(invoice.id);
	}
}
```

Use this mainly for hot paths or larger datasets. Prefer readability when the collection is small and the chained version is obviously clearer.
