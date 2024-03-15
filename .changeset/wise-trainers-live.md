---
'@pandacss/is-valid-prop': minor
'@pandacss/generator': minor
'@pandacss/studio': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

## Changes

When using `strictTokens: true`, if you didn't have `tokens` (or `semanticTokens`) on a given `Token category`, you'd
still not be able to use _any_ values in properties bound to that category. Now, `strictTokens` will correctly only
restrict properties that have values in their token category.

Example:

```ts
// panda.config.ts

export default defineConfig({
  // ...
  strictTokens: true,
  theme: {
    extend: {
      colors: {
        primary: { value: 'blue' },
      },
      // borderWidths: {}, // ⚠️ nothing defined here
    },
  },
})
```

```ts
// app.tsx
css({
  // ❌ before this PR, TS would throw an error as you are supposed to only use Tokens
  // even thought you don't have any `borderWidths` tokens defined !

  // ✅ after this PR, TS will not throw an error anymore as you don't have any `borderWidths` tokens
  // if you add one, this will error again (as it's supposed to)
  borderWidths: '123px',
})
```

## Description

- Simplify typings for the style properties.
- Add the `csstype` comments for each property.

You will now be able to see a utility or `csstype` values in 2 clicks !

## How

Instead of relying on TS to infer the correct type for each properties, we now just generate the appropriate value for
each property based on the config.

This should make it easier to understand the type of each property and might also speed up the TS suggestions as there's
less to infer.
