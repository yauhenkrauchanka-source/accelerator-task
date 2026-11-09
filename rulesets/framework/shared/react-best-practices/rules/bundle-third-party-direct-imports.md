# Avoid Heavy Third-Party Barrel Imports

Import large third-party packages as directly as practical when the package is known to have expensive barrel exports.

Important repo exception:

- internal feature public API barrels like `@/features/billing` remain allowed and are part of this architecture

Bad:

```tsx
import { Chart, Grid, Legend } from "some-heavy-chart-library";
```

Better:

```tsx
import { Chart } from "some-heavy-chart-library/chart";
import { Grid } from "some-heavy-chart-library/grid";
import { Legend } from "some-heavy-chart-library/legend";
```

Why it matters:

- improves dev startup and cold imports
- reduces accidental loading of unused library code

Do not apply this blindly. Prefer it for known heavy packages, not every library in the repo.
