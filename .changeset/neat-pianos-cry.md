---
'@pandacss/token-dictionary': minor
'@pandacss/core': minor
---

Support token reference syntax when authoring styles object, text styles and layer styles.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  border: '2px solid {colors.primary}',
})
```

This will resolve the token reference and convert it to css variables.

```css
.border_2px_solid_\{colors\.primary\} {
  border: 2px solid var(--colors-primary);
}
```

The alternative to this was to use the `token(...)` css function which will be resolved.

### `token(...)` vs `{...}`

Both approaches return the css variable

```jsx
const styles = css({
  // token reference syntax
  border: '2px solid {colors.primary}',
  // token function syntax
  border: '2px solid token(colors.primary)',
})
```

However, The `token(...)` syntax allows you to set a fallback value.

```jsx
const styles = css({
  border: '2px solid token(colors.primary, red)',
})
```
