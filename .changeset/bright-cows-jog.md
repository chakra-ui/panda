---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add support for array values in the special `css` property for the JSX factory and JSX patterns

This makes it even easier to merge styles from multiple sources.

```tsx
import { Stack, styled } from '../styled-system/jsx'

const HeroSection = (props) => {
  return (
    <Stack css={[{ color: 'blue.300', padding: '4' }, props.css]}>
      <styled.div css={[{ fontSize: '2xl' }, props.hero]}>Hero Section</styled.div>
    </Stack>
  )
}

const App = () => {
  return (
    <>
      <HeroSection css={{ backgroundColor: 'yellow.300' }} hero={css.raw({ fontSize: '4xl', color: 'red.300' })} />
    </>
  )
}
```

should render something like:

```html
<div class="d_flex flex_column gap_10px text_blue.300 p_4 bg_yellow.300">
  <div class="fs_4xl text_red.300">Hero Section</div>
</div>
```
