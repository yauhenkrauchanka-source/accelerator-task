# Preload Heavy Code When User Intent Is Clear

When a route or panel is expensive and user intent is obvious, you can start loading it before the final click.

Example:

```tsx
function BillingNavLink() {
	return (
		<button
			onMouseEnter={() => {
				void import("@/features/billing");
			}}
		>
			Open billing
		</button>
	);
}
```

Use this carefully:

- only for clearly heavy destinations
- only when user intent is a strong signal
- do not spray preloads across every hover interaction
