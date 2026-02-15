---
'@pandacss/core': minor
'@pandacss/parser': minor
---

Add support for `*Css` prop convention in JSX components.

Any JSX prop ending with `Css` (camelCase, e.g. `inputCss`, `wrapperCss`) is now treated as a style prop during static
extraction, enabling compound component patterns like:

```tsx
function Comp(props) {
  const { inputCss, wrapperCss, children } = props
  return (
    <styled.div css={wrapperCss}>
      <styled.input css={inputCss} />
      {children}
    </styled.div>
  )
}

// Usage - styles are statically extracted
const usage = <Comp inputCss={{ color: 'red.200' }} wrapperCss={{ display: 'flex' }} />
```

This works in both `all` and `minimal` JSX style prop modes, with no configuration needed.
