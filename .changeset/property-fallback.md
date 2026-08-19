---
'@pandacss/compiler': minor
'@pandacss/types': minor
---

Add `optimize.propertyFallback`, which also seeds each emitted `@property` registration as a plain declaration so engines that ignore `@property` (Safari below 16.4, Firefox below 128) still get the defaults.

```ts
export default defineConfig({
  optimize: { propertyFallback: true },
})
```

Off by default. Seeds come from the registrations that survived pruning, so you only pay for the variables you use.
