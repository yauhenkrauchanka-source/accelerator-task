# Use content-visibility For Large Offscreen Sections

For long, heavy scrollable content, `content-visibility` can reduce render cost for offscreen sections.

Example:

```tsx
<section className="[content-visibility:auto] [contain-intrinsic-size:600px]">
	<HeavyBillingHistory />
</section>
```

Use this when:

- a section is large
- much of it starts offscreen
- layout jumps are acceptable with an intrinsic size hint

Do not apply it blindly to small components.
