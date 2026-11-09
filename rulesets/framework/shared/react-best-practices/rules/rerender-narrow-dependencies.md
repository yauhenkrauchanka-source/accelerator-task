# Use Narrow Primitive Effect Dependencies

Effects should depend on the smallest stable value that actually controls the behavior.

Bad:

```tsx
useEffect(() => {
	logWorkspaceView(workspace.id);
}, [workspace]);
```

Better:

```tsx
useEffect(() => {
	logWorkspaceView(workspace.id);
}, [workspace.id]);
```

Also prefer derived primitive conditions when possible:

```tsx
const isOverdue = invoice.status === "overdue";

useEffect(() => {
	if (isOverdue) {
		showOverdueNotice();
	}
}, [isOverdue]);
```

Why it matters:

- reduces unnecessary effect re-runs
- makes the effect contract easier to understand
