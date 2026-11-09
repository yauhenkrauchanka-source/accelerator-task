# Start Independent Work Early, Await Dependent Work Late

Some tasks are partially dependent rather than fully independent. Start what you can early, then await in dependency order.

Bad:

```ts
const workspace = await getWorkspace(workspaceId);
const members = await getWorkspaceMembers(workspace.id);
const billing = await getBillingSummary(workspace.id);
```

Better:

```ts
const workspacePromise = getWorkspace(workspaceId);
const featureFlagsPromise = getWorkspaceFeatureFlags(workspaceId);

const workspace = await workspacePromise;
const featureFlags = await featureFlagsPromise;

const [members, billing] = await Promise.all([
	getWorkspaceMembers(workspace.id),
	getBillingSummary(workspace.id),
]);
```

Why it matters:

- reduces the total number of serial waits
- keeps the code explicit without adding helper libraries
