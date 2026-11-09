# Run Independent Async Work In Parallel

If async operations do not depend on one another, start them together and await them together.

Bad:

```ts
const workspace = await getWorkspace(workspaceId);
const billing = await getBillingSummary(workspaceId);
const members = await getWorkspaceMembers(workspaceId);
```

Better:

```ts
const [workspace, billing, members] = await Promise.all([
	getWorkspace(workspaceId),
	getBillingSummary(workspaceId),
	getWorkspaceMembers(workspaceId),
]);
```

Why it matters:

- removes avoidable waterfalls
- improves route and panel load times

Use this only when the operations are truly independent.
