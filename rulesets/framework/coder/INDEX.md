# React Coder Rule Index

Choose the smallest matching set.

## Any Changed Component

- [Explicit Conditional Rendering](../shared/react-best-practices/rules/rendering-conditional-render.md)
- [Early Exit](../shared/react-best-practices/rules/js-early-exit.md)

## State, Effects, Events, Or Derived Values

- [Narrow Dependencies](../shared/react-best-practices/rules/rerender-narrow-dependencies.md)
- [Derived State](../shared/react-best-practices/rules/rerender-derived-state.md)
- [Functional State Updates](../shared/react-best-practices/rules/rerender-functional-setstate.md)
- [Lazy State Initialization](../shared/react-best-practices/rules/rerender-lazy-state-init.md)
- [Deferred Reads](../shared/react-best-practices/rules/rerender-defer-reads.md)
- [Transitions](../shared/react-best-practices/rules/rerender-transitions.md)
- [Event Listeners](../shared/react-best-practices/rules/client-event-listeners.md)

## Async Work

- [Defer Await](../shared/react-best-practices/rules/async-defer-await.md)
- [Dependency-Aware Async](../shared/react-best-practices/rules/async-dependency-aware.md)
- [Parallel Async](../shared/react-best-practices/rules/async-parallel.md)

## Lists And Repeated Rendering

- [Content Visibility](../shared/react-best-practices/rules/rendering-content-visibility.md)
- [Hoist Static Work](../shared/react-best-practices/rules/rendering-hoist-static-work.md)
- [Combine Iterations](../shared/react-best-practices/rules/js-combine-iterations.md)
- [Set And Map Lookups](../shared/react-best-practices/rules/js-set-map-lookups.md)
- [Immutable Sorting](../shared/react-best-practices/rules/js-tosorted-immutable.md)

## Heavy Components Or Dependencies

- [Conditional Loading](../shared/react-best-practices/rules/bundle-conditional-loading.md)
- [Intent Preload](../shared/react-best-practices/rules/bundle-intent-preload.md)
- [Lazy Heavy Components](../shared/react-best-practices/rules/bundle-lazy-heavy-components.md)
- [Direct Third-Party Imports](../shared/react-best-practices/rules/bundle-third-party-direct-imports.md)

## Reusable Component APIs

- [Avoid Boolean Props](../shared/composition-patterns/rules/architecture-avoid-boolean-props.md)
- [Compound Components](../shared/composition-patterns/rules/architecture-compound-components.md)
- [Children Over Render Props](../shared/composition-patterns/rules/patterns-children-over-render-props.md)
- [Explicit Variants](../shared/composition-patterns/rules/patterns-explicit-variants.md)
- [Decouple State From UI](../shared/composition-patterns/rules/state-decouple-implementation.md)

For React 19 or later only:

- [React 19 Ref And Context APIs](../shared/composition-patterns/rules/react19-no-forwardref.md)

