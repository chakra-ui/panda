---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Fix type errors when an app extends a design system. Tokens, keyframes or conditions the app added were rejected
wherever the design system's types were used, like its component props. The design system's types now follow the
app's, including through nested design systems.

```ts
import type { SystemStyleObject } from '@acme/ds/types'

const styles: SystemStyleObject = css.raw({ animationName: 'appFade' }) // ✅ app keyframe, no longer an error
```
