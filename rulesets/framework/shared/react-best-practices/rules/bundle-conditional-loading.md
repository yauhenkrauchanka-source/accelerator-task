# Load Modules Only When The Feature Is Active

Do not eagerly load code for behavior the user has not activated yet.

Bad:

```ts
import { openAdvancedBillingExport } from "@/features/billing/lib/advanced-export";
```

Better:

```ts
async function handleAdvancedExport() {
	const { openAdvancedBillingExport } = await import(
		"@/features/billing/lib/advanced-export"
	);

	openAdvancedBillingExport();
}
```

Why it matters:

- keeps initial bundles smaller
- pays the cost only when the user asks for the feature
