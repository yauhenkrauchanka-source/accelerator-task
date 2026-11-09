# Use Set Or Map For Repeated Membership Lookups

If repeated lookups are the real operation, prefer `Set` or `Map` over repeated array scanning.

Bad:

```ts
const selectedInvoiceIds = selectedInvoices.map((invoice) => invoice.id);

const visibleInvoices = invoices.filter((invoice) =>
	selectedInvoiceIds.includes(invoice.id),
);
```

Better:

```ts
const selectedInvoiceIds = new Set(
	selectedInvoices.map((invoice) => invoice.id),
);

const visibleInvoices = invoices.filter((invoice) =>
	selectedInvoiceIds.has(invoice.id),
);
```

Why it matters:

- improves repeated membership checks
- makes the lookup intent explicit
