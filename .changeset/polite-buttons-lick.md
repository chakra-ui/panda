---
'@pandacss/token-dictionary': minor
'@pandacss/preset-panda': minor
'@pandacss/preset-base': minor
---

Add support for aspect ratio tokens in the panda config or preset. Aspect ratio tokens are used to define the aspect
ratio of an element.

```js
export default defineConfig({
  // ...
  theme: {
    extend: {
      // add aspect ratio tokens
      tokens: {
        aspectRatios: {
          '1:1': '100%',
          '16:9': '56.25%',
          '4:3': '75%',
        },
      },
    },
  },
})
```

Here's what the default aspect ratio tokens in the base preset looks like:

```json
{
  "square": { "value": "1 / 1" },
  "landscape": { "value": "4 / 3" },
  "portrait": { "value": "3 / 4" },
  "wide": { "value": "16 / 9" },
  "ultrawide": { "value": "18 / 5" },
  "golden": { "value": "1.618 / 1" }
}
```

**Breaking Change**

The built-in token values has been removed from the `aspectRatio` utility to the `@pandacss/preset-base` as a token.

For most users, this change should be a drop-in replacement. However, if you used a custom preset in the config, you
might need to update it to include the new aspect ratio tokens.
