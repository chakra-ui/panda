---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Fix type errors when your app extends a design system.

Tokens, keyframes or conditions your app added were rejected by the design system's types, like its component props. Now
they're accepted, including through nested design systems.

```ts
import type { SystemStyleObject } from '@acme/ds/types'

const styles: SystemStyleObject = css.raw({ animationName: 'appFade' }) // ✅ your keyframe
```
