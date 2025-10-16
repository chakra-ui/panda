---
'@pandacss/generator': patch
---

**Style Context (Solid)**

- Fix issue where `withProvider` does not properly provide context leading to runtime errors when wrapping headless
  component libraries like Ark UI.

- Refactor `withProvider` and `withContext` types to ensure required props are properly extracted from the component
  props.
