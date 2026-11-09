# React Code Reviewer Rule Index

Route the review through the matching categories in the [React Coder Rule Index](../coder/INDEX.md), then apply these review priorities:

- state ownership and derived-state correctness;
- effect dependencies, subscriptions, cleanup, and stale closures;
- explicit conditional rendering and stable repeated rendering;
- avoidable async waterfalls and eager heavy imports;
- component API composition and boolean-prop growth;
- version-gated React APIs;
- meaningful behavior tests for the changed risks.

Do not report an optimization as a defect without a concrete cost or correctness risk.

