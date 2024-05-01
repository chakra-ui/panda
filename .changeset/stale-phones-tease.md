---
'@pandacss/generator': patch
'@pandacss/shared': patch
---

Allow passing arrays of `SystemStyleObject` to the `css(xxx, [aaa, bbb, ccc], yyy)` fn

This is useful when you are creating your own styled component and want to benefit
[from the recent `css` array property support](https://github.com/chakra-ui/panda/pull/2515).

```diff
import { css } from 'styled-system/css'
import type { HTMLStyledProps } from 'styled-system/types'

type ButtonProps = HTMLStyledProps<'button'>

export const Button = ({ css: cssProp = {}, children }: ButtonProps) => {
-  const className = css(...(Array.isArray(cssProp) ? cssProp : [cssProp]))
+  const className = css(cssProp)
  return <button className={className}>{children}</button>
}
```
