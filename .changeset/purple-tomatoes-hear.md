---
'@pandacss/core': minor
---

Add support resolving `DEFAULT` in textStyles and layerStyles, just like tokens.

```jsx
export default defineConfig({
  theme: {
    textStyles: {
      display: {
        // 'display'
        DEFAULT: {
          value: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
          },
        },
        // 'display.large'
        large: {
          value: {
            fontSize: '2rem',
            fontWeight: 'bold',
          },
        },
      },
    },
  },
})
```

In case, you can use `textStyles: display` to reference the DEFAULT display value.

```jsx
css({ textStyle: 'display' })
```
