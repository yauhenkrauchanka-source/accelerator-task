# Subscribe To Derived State When That Is The Real Trigger

If a component only cares about a boolean or narrow derived signal, subscribe to that instead of the whole raw value.

Bad:

```tsx
const width = useViewportWidth();

useEffect(() => {
	if (width < 768) {
		enableCompactMode();
	}
}, [width]);
```

Better:

```tsx
const width = useViewportWidth();
const isCompact = width < 768;

useEffect(() => {
	if (isCompact) {
		enableCompactMode();
	}
}, [isCompact]);
```

Why it matters:

- reduces unnecessary recalculation and effect churn
- makes intent clearer
