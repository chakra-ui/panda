---
'@pandacss/generator': minor
'@pandacss/shared': minor
'@pandacss/core': minor
---

Move config recipe `compoundVariants` styles into the `@layer recipes` cascade layer.

Previously, compound variant styles were emitted as atomic utilities in the `@layer utilities` layer. This made it impossible to override individual properties from a compound variant using atomic styles passed through `cx()`, since atomic-vs-atomic specificity ties always favored declaration order rather than the user's intent.

Each compound variant now produces a deterministic class name of the form `{recipe}--compound{separator}{index}` (or `{recipe}__{slot}--compound{separator}{index}` for slot recipes) and is emitted in the recipe layer. Atomic styles in the utilities layer reliably override compound-variant styles, matching the existing behavior of base and variant styles.

Notes:

- `cva` (atomic recipes) is unchanged — its compound variants remain atomic by design.
- The generated runtime now joins compound variant class names instead of re-extracting their CSS, producing smaller runtime output for recipes with compound variants.
- Slot recipes preserve a stable compound index across all slots, so a single compound variant produces matching class suffixes on every slot it touches.
