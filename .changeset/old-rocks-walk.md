---
'@pandacss/generator': patch
---

- Change the `css` function signature to allow passing multiple style objects that will be smartly merged.
- Rename the `{cvaFn}.resolve` function to `{cva}.raw` to align with the other functions.
- Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments passed
  in. This is to allow the `css` function to merge the styles correctly.

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return (
    <>
      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
        Will result in `class="mx_10 pt_6"`
      </div>
    </>
  )
}
```

⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to its
original behavior of just concatenating class names.

```diff
import { css, cx } from '../styled-system/css'

const App = () => {
  return (
    <>
-      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
+      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
        Will result in `class="mx_10 pt_6"`
      </div>
    </>
  )
}
```

---

This change, in combination with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects to be
merged as expected in any situation. If you intend for your components to have overridable styles, rather than passing
the result of the `css` function as props, you should pass the style objects using the `raw` functions and just call the
`css` function in the component itself.

Example:

```tsx title="src/components/Button.tsx"
'use client'
import * as React from 'react'
import { flex } from '../../styled-system/patterns'
import { css, cva } from '../../styled-system/css'
import { SystemStyleObject } from '../../styled-system/types'

export function Button(props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) {
  const flexProps = flex.raw({ direction: 'row', _hover: { color: 'blue.400' }, border: '1px solid' })
  const rootStyle = css(flexProps, props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}

const thing = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Thingy = (props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) => {
  const rootStyle = css(thing.raw({ variant: 'primary' }), css.raw({ _hover: { color: 'blue.400' } }), props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}
```

```tsx title="src/app/page.tsx"
import { css } from '../../styled-system/css'
import { Button, Thingy } from './Button'

export default function Home() {
  return (
    <>
      <Button css={css.raw({ display: 'block', _hover: { color: 'red' } })}>
        Client component button with pattern
        <span>will result in `class="d_block flex_row hover:text_red border_1px_solid"`</span>
      </Button>
      <Thingy css={css.raw({ display: 'block', _hover: { color: 'yellow' } })}>
        Client component button with recipe
        <span>will result in `class="d_block fs_lg text_white bg_blue.500 hover:text_yellow"`</span>
      </Thingy>
    </>
  )
}
```
