---
'@pandacss/compiler': minor
---

Fix `objectPosition`, `backgroundPosition` and the other position properties rejecting valid values like `center` under
`strictTokens`. `system.d.ts` declared `PositionValue`, `ContainerValue` and `ZIndexValue` twice, so TypeScript bound
the wrong one and reported `Duplicate identifier` under `skipLibCheck: false`.

Panda's built-in CSS value types are renamed with a `Css` prefix, so the `{Property}Value` aliases generated from your
utilities can no longer shadow them:

```ts
// before
import type { PositionValue, LengthValue, Globals } from './styled-system/types'

// after
import type { CssPosition, CssLength, CssGlobals } from './styled-system/types'
```
