---
'@pandacss/generator': patch
---

Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

```tsx
import { styled } from '../styled-system/jsx'
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
    <SplitComponent w="2" onClick={() => console.log('123')}>
      Click me
    </SplitComponent>
  )
}
```
