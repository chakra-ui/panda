---
'@pandacss/config': minor
'@pandacss/compiler': minor
---

Compose design systems. A design system can now extend another by setting its own `designSystem` field, and you still
write one line in your config — the parent comes along for free.

Set `designSystem: '@acme/marketing'`, and if `@acme/marketing` was built on `@acme/foundations`, Panda walks the chain
and merges both presets under your config: foundations first, then marketing, then you on top. Each parent resolves from
where its child is installed, so it works in monorepos and Docker builds where the consumer only depends on the leaf.
Each design system's pre-extracted styles hydrate under its own name. A cycle (`@a` → `@b` → `@a`) or a parent that
isn't installed stops the build with a message that names the package and what to do.
