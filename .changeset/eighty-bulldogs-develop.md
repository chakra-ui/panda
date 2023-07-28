---
'@pandacss/preset-base': minor
'@pandacss/generator': minor
'@pandacss/fixture': minor
'@pandacss/parser': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

### Breaking

- Renamed the `name` property of a config recipe to `className`. This is to ensure API consistency and express the
  intent of the property more clearly.

```diff
export const buttonRecipe = defineRecipe({
-  name: 'button',
+  className: 'button',
  // ...
})
```

- Renamed the `jsx` property of a pattern to `jsxName`.

```diff
const hstack = definePattern({
-  jsx: 'HStack',
+  jsxName: 'HStack',
  // ...
})
```

### Feature

Update the `jsx` property to be used for advanced tracking of custom pattern components.

```jsx
import { Circle } from 'styled-system/jsx'
const CustomCircle = ({ children, ...props }) => {
  return <Circle {...props}>{children}</Circle>
}
```

To track the `CustomCircle` component, you can now use the `jsx` property.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  patterns: {
    extend: {
      circle: {
        jsx: ['CustomCircle'],
      },
    },
  },
})
```
