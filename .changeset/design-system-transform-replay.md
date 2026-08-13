---
'@pandacss/compiler': patch
---

Fix a `designSystem` consumer dropping a library utility's `transform` when replaying its build info, emitting the
wrong (sometimes invalid) property.

```tsx
// library built with `panda lib`
<Box boxSize="4" /> // .size_4 { width: …; height: … }

// consumer via `designSystem` — was `.size_4 { box-size: … }`, now width/height
```

Transform results now travel in the artifact, so a replayed atom emits the same CSS the library did. Requires
regenerating the library's build info (`schemaVersion` 6); older artifacts re-extract from source.
