# React Behavior Testing

- Render through the project's existing provider and router helpers when the component depends on them.
- Drive interactions as a user would and assert accessible output, state transitions, navigation, and side effects.
- Cover async pending, success, empty, error, cancellation, and retry behavior only when the component can reach those states.
- Test hooks through observable consumers or the project's established hook harness.
- Avoid asserting internal state, hook call order, private component structure, or snapshots alone.
- Use the existing runner and mocking boundary; do not impose a particular testing library.

