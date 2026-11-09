# Hoist Static Work When It Meaningfully Reduces Repeated Work

If markup or derived values are truly static and expensive enough to matter, hoist them outside the render path.

Bad:

```tsx
function EmptyState() {
	return (
		<div>
			<LargeStaticIllustration />
		</div>
	);
}
```

Better:

```tsx
const emptyStateIllustration = <LargeStaticIllustration />;

function EmptyState() {
	return <div>{emptyStateIllustration}</div>;
}
```

Use judgment here:

- this helps most with large static SVG trees or expensive static markup
- do not turn every tiny JSX fragment into a top-level constant
- if the surrounding codebase already relies on compiler optimizations, prefer clarity over ritual hoisting
