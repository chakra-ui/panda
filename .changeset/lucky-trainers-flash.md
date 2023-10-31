---
'@pandacss/generator': minor
---

Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

```tsx
import { splitCssProps, styled } from '../styled-system/jsx'
import type { HTMLStyledProps } from '../styled-system/types'

function SplitComponent({ children, ...props }: HTMLStyledProps<'div'>) {
  const [cssProps, restProps] = splitCssProps(props)
  return (
    <styled.div {...restProps} className={css({ display: 'flex', height: '20', width: '20' }, cssProps)}>
      {children}
    </styled.div>
  )
}

// Usage

function App() {
  return (
    <SplitComponent margin="2">
      Click me
    </SplitComponent>
  )
}
```
