---
'@pandacss/types': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
'@pandacss/config': minor
---

Add `viewTransition()` for the View Transitions API. Pass slot styles, get a stable `vt_*` bag class, and Panda emits the matching `::view-transition-*` rules. Import from `styled-system/css`. You still set unique `view-transition-name` values at runtime — Panda only owns the shared CSS. Design-system build info carries the bags so apps hydrate them without re-extracting.

```ts
import { viewTransition } from 'styled-system/css'

const slide = viewTransition({
  group: { animationDuration: '0.4s' },
  old: { opacity: 0 },
  new: { opacity: 1 },
})
```

```tsx
// React / Next
import { ViewTransition } from 'react'

<ViewTransition name="hero" share={slide}>
  <img src="…" alt="…" />
</ViewTransition>
```

```html
<!-- Astro -->
<img class={slide} transition:name="hero" src="…" alt="…" />
```

```tsx
// Solid / Nuxt — framework starts the transition; you attach name + bag class
<img class={slide} style={{ viewTransitionName: 'hero' }} src="…" alt="…" />
```
