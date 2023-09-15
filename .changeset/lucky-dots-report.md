---
'@pandacss/extractor': patch
'@pandacss/parser': patch
---

feat(parser): extract {fn}.raw as an identity fn

so this will now work:

```ts
import { css } from 'styled-system/css'

const paragraphSpacingStyle = css.raw({
  '&:not(:first-child)': { marginBlockEnd: '1em' },
})

export const proseCss = css.raw({
  maxWidth: '800px',
  '& p': {
    '&:not(:first-child)': { marginBlockStart: '1em' },
  },
  '& h1': paragraphSpacingStyle,
  '& h2': paragraphSpacingStyle,
})
```

& use ECMA preset for ts-evaluator: This means that no other globals than those that are defined in the ECMAScript spec
such as Math, Promise, Object, etc, are available but it allows for some basic evaluation of expressions like this:

```ts
import { cva } from '.panda/css'

const variants = () => {
  const spacingTokens = Object.entries({
    s: 'token(spacing.1)',
    m: 'token(spacing.2)',
    l: 'token(spacing.3)',
  })

  const spacingProps = {
    px: 'paddingX',
    py: 'paddingY',
  }

  // Generate variants programmatically
  return Object.entries(spacingProps)
    .map(([name, styleProp]) => {
      const variants = spacingTokens
        .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
        .reduce((_agg, kv) => ({ ..._agg, ...kv }))

      return { [name]: variants }
    })
    .reduce((_agg, kv) => ({ ..._agg, ...kv }))
}

const baseStyle = cva({
  variants: variants(),
})
```
