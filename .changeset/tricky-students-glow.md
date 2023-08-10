---
'@pandacss/generator': patch
'@pandacss/shared': patch
'@pandacss/types': patch
---

Add `config.missingCssWarning` option that logs a warning message when a CSS rule was used at runtime but couldn't be
statically extracted

In the example code below, the `color` property and the `weight` value are not statically extractable, so there will be
2 warning messages:

- No matching CSS rule found for font_italic
- No matching CSS rule found for text_pink.200

```ts
import { useState } from 'react'
import { css, cx } from '../styled-system/css'

export const App = () => {
  const [colorTint, setColorTint] = useState(200)
  const [weight, setWeight] = useState('italic')

  return (
    <>
      <div
        className={cx(
          css({ fontSize: '4xl', fontWeight: weight }),
          css({ backgroundColor: 'yellow.200', color: `pink.${colorTint}` }),
        )}
      >
        Hello world
      </div>
    </>
  )
}
```
