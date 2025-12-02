---
'@pandacss/core': patch
'@pandacss/parser': patch
---

Fix css.raw spreading within selectors and conditions

Fixed several scenarios where spreading css.raw objects wouldn't be properly extracted:

**Child selectors:**

```js
const baseStyles = css.raw({ margin: 0, padding: 0 })
const component = css({
  '& p': { ...baseStyles, fontSize: '1rem' }, // Now works
})
```

**Nested conditions:**

```js
const interactive = css.raw({ cursor: 'pointer', transition: 'all 0.2s' })
const card = css({
  _hover: {
    ...interactive, // Now works
    _dark: { ...interactive, color: 'white' },
  },
})
```

**CSS aliases:**

```js
import { css as xcss } from 'styled-system/css'
const styles = xcss.raw({ color: 'red' })
// xcss.raw now properly recognized
```
