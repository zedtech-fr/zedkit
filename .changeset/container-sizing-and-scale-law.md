---
"@zedtech/zedkit-ui": major
"@zedtech/zedkit-quality": patch
---

Container-aware sizing, declared scales, and correctness fixes on top of the role-class migration.

UI (breaking): `Card` gains `size="sm" | "lg"` and `Container` gains `query` — inside a `zk-query` slot, card padding, gap, radius and title/body type step up at 30rem; without a slot the base recipe renders exactly as before. `Stack` numeric `gap` props are removed (role names only: `tight`, `sm`, `md`, `lg`, `prose`, `list`, `blocks` — same rendered gaps). Site-only text roles (`text-specimen-title`, `text-demo-heading`, `text-scene-title`, `text-preview-title`, `text-offer-price`, `text-brand-word`, `text-product-name`, `text-purpose`, `text-compact-heading`, `text-figure`, `text-step-heading`) moved out of the package to the docs site. Dead utilities (`w-panel`, `mt-figure`, `space-y-sections`, `top-float`, `left-float`) and rem alias tokens (`--spacing-icon-control`, `--spacing-button-inline`, `--spacing-button-inline-lg`) are deleted. Component CSS now lives in `@layer components` and type roles are real utilities, so consumer `className` utilities override components again. Density-derived tokens re-resolve inside nested identity scopes. The registry copy path now ships the full generated theme (utilities, tokens, keyframes) the copied bricks use.

Quality (patch): the scale scanner sees classes inside template interpolations, runs in linear time on degenerate inputs, resolves a relative Tailwind `entryPoint` deterministically, and the baseline ratchet refuses any increase via `--write`; shipped sources must be at zero.
