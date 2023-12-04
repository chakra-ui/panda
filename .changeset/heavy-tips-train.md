---
'@pandacss/generator': minor
'@pandacss/shared': minor
'@pandacss/core': minor
---

Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[` and suffixing
with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

```ts
import { css } from '../styled-system/css'

css({
  // @ts-expect-error TS will throw when using from strictTokens: true
  color: '#fff',
  // @ts-expect-error TS will throw when using from strictTokens: true
  width: '100px',

  // ✅ but this is now allowed:
  bgColor: '[rgb(51 155 240)]',
  fontSize: '[12px]',
})
```
