---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Resolve conditional variants in recipe calls and JSX at build time. `button({ size: cond ? 'sm' : 'lg' })` now emits a
class ternary instead of applying both sizes, and several conditional variants resolve into a decision tree that gets
defaults and compound variants right. Usages that still can't resolve to one class list are left for the runtime.
