# Deduplicate Global Event Listeners

Avoid attaching multiple identical global listeners from multiple component instances when a shared mechanism can do the job.

Bad:

```tsx
function ResizeAwareCard() {
	useEffect(() => {
		const onResize = () => console.log(window.innerWidth);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
}
```

Better:

```tsx
function subscribeToWindowWidth(callback: () => void) {
	window.addEventListener("resize", callback);
	return () => window.removeEventListener("resize", callback);
}
```

Or centralize the listener behind a shared hook or store when several components need the same signal.

Why it matters:

- reduces duplicate work
- simplifies teardown behavior
