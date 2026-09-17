---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Let a component's `css` prop accept some properties but not others:

```ts
import type { SystemStyleObjectWith } from '../styled-system/types'

interface ButtonProps {
  css?: SystemStyleObjectWith<'margin' | 'marginTop' | 'width'>
}
```

Conditions and nested selectors still work inside it. `SystemStyleObjectWithout<K>` is the inverse.
