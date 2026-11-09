# Lazy-Load Heavy UI With React.lazy Or Route Splitting

For components that are large and not needed on first render, prefer lazy loading.

Bad:

```tsx
import { BillingChartPanel } from "./billing-chart-panel";

export function BillingOverviewPage() {
	return <BillingChartPanel />;
}
```

Better:

```tsx
import { Suspense, lazy } from "react";

const BillingChartPanel = lazy(() =>
	import("./billing-chart-panel").then((module) => ({
		default: module.BillingChartPanel,
	})),
);

export function BillingOverviewPage() {
	return (
		<Suspense fallback={<div>Loading chart…</div>}>
			<BillingChartPanel />
		</Suspense>
	);
}
```

Why it matters:

- keeps initial route bundles lighter
- delays expensive UI code until the user actually needs it
