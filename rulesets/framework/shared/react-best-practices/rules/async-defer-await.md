# Defer Await Until It Is Actually Needed

Avoid awaiting work before you know the result is needed.

Use this when:

- early returns are common
- one branch can complete without remote data
- permission or existence checks can short-circuit later work

Bad:

```ts
async function loadBillingPage(workspaceId: string, skip: boolean) {
	const summary = await getBillingSummary(workspaceId);

	if (skip) {
		return { skipped: true };
	}

	return { skipped: false, summary };
}
```

Better:

```ts
async function loadBillingPage(workspaceId: string, skip: boolean) {
	if (skip) {
		return { skipped: true };
	}

	const summary = await getBillingSummary(workspaceId);
	return { skipped: false, summary };
}
```

Why it matters:

- avoids blocking fast paths
- reduces unnecessary network work on skipped branches
