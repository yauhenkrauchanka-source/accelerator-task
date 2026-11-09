# Use Transitions For Non-Urgent Updates

For frequent updates that should not block user interaction, consider `startTransition`.

Bad:

```tsx
function BillingSearch() {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("");

	return (
		<input
			value={query}
			onChange={(event) => {
				const nextValue = event.target.value;
				setQuery(nextValue);
				setFilter(nextValue);
			}}
		/>
	);
}
```

Better:

```tsx
import { startTransition } from "react";

function BillingSearch() {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("");

	return (
		<input
			value={query}
			onChange={(event) => {
				const nextValue = event.target.value;
				setQuery(nextValue);

				startTransition(() => {
					setFilter(nextValue);
				});
			}}
		/>
	);
}
```

Use this when it clearly improves responsiveness, not as a blanket default.
