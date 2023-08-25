---
'@pandacss/generator': patch
---

- Change the `css` function signature to allow passing multiple style objects that will be smartly merged.
- Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
- Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments passed
  in. This is to allow the `css` function to merge the styles correctly.

```tsx
import { css } from '../styled-system/css'
css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' }) // => mx_10 pt_6
```

> ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to its
> original classname concatenation behaviour.

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

To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll be
merged correctly.

```tsx title="src/components/Button.tsx"
import { css } from '../../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css({ display: 'flex', alignItem: 'center', color: 'black' }, cssProp)
  return <button className={className}>{children}</button>
}
```

Then you can use the `Button` component like this:

```tsx title="src/app/page.tsx"
import { css } from '../../styled-system/css'
import { Button, Thingy } from './Button'

export default function Page() {
  return (
    <Button css={{ color: 'pink', _hover: { color: 'red' } }}>
      will result in `class="d_flex align_center text_pink hover:text_red"`
    </Button>
  )
}
```

---

You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
to be merged as expected in any situation.

**Pattern Example:**

```tsx title="src/components/Button.tsx"
import { hstack } from '../../styled-system/patterns'
import { css, cva } from '../../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  // using the flex pattern
  const hstackProps = hstack.raw({
    border: '1px solid',
    _hover: { color: 'blue.400' },
  })

  // merging the styles
  const className = css(hstackProps, cssProp)

  return <button className={className}>{children}</button>
}
```

**CVA Example:**

```tsx title="src/components/Button.tsx"
import { css, cva } from '../../styled-system/css'

const buttonRecipe = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css(
    // using the button recipe
    buttonRecipe.raw({ variant: 'primary' }),

    // adding style overrides (internal)
    { _hover: { color: 'blue.400' } },

    // adding style overrides (external)
    cssProp,
  )

  return <button className={className}>{props.children}</button>
}
```
