---
'@pandacss/generator': minor
'@pandacss/core': minor
---

You can now set and override `defaultValues` in pattern configurations.

Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

```js
defineConfig({
  patterns: {
    hstack: {
      properties: {
        justify: { type: 'property', value: 'justifyContent' },
        gap: { type: 'property', value: 'gap' },
      },
      defaultValues: { gap: '40px' },
      transform(props) {
        const { justify, gap, ...rest } = props
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: justify,
          gap,
          ...rest,
        }
      },
    },
  },
})
```
