# Use Lazy State Initialization For Expensive Initial Values

If the initial value is expensive to compute, pass an initializer function to `useState`.

Bad:

```tsx
const [lookup] = useState(buildBillingLookup(rawInvoices));
```

Better:

```tsx
const [lookup] = useState(() => buildBillingLookup(rawInvoices));
```

Why it matters:

- prevents the initialization work from running on every render
