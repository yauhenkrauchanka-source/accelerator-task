# Read State Where It Is Used

Do not subscribe a component to state that is only needed later inside a callback or event path.

Bad:

```tsx
function RetryInvoiceButton() {
	const canRetry = useBillingStore((state) => state.canRetry);

	return <button onClick={() => retryInvoice(canRetry)}>Retry</button>;
}
```

Better:

```tsx
function RetryInvoiceButton() {
	return (
		<button
			onClick={() => {
				const canRetry = billingStore.getState().canRetry;
				retryInvoice(canRetry);
			}}
		>
			Retry
		</button>
	);
}
```

Use this only when the value is not needed for rendering.
