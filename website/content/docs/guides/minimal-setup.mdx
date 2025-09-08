---
title: Minimal Setup
description: How to set up Panda with the bare minimum.
---

# Minimal Setup

The default Panda setup includes utilities and design tokens by default. In this guide, you'll see how to strip out the defaults and start from scratch.

## Removing default tokens

To remove the default design tokens injected by Panda, set the `presets` key to an empty array:

```js
export default defineConfig({
  // ...
  presets: []
})
```

This allows you to define your own tokens, without having to use the `extend` key in the theme.

```js
export default defineConfig({
  // ...
  theme: {
    tokens: {
      colors: {
        primary: { value: '#ff0000' }
      }
    }
  }
})
```

## Removing default utilities

Use the `eject: true` property to remove all the default utilities.

Panda doesn't automatically know which tokens are valid for which CSS properties, so it is necessary to tell Panda that my tokens from the "colors" category are valid for the CSS property "color".

```js
export default defineConfig({
  // ...
  eject: true,
  utilities: {
    color: {
      values: 'colors'
    }
  },
  theme: {
    tokens: {
      colors: {
        primary: { value: '#ff0000' }
      }
    }
  }
})
```

This makes `<p className={css({ color: 'primary' })}> Text </p>` work as expected.

## Re-using Panda presets

Panda offers 2 presets:

- `@pandacss/preset-base`: This is a relatively unopinionated set of utilities for mapping CSS properties to values (almost everyone will want these)

You can use these presets by installing them via npm and adding them to your `presets` key:

```js
export default defineConfig({
  // ...
  presets: ['@pandacss/preset-base']
})
```

- `@pandacss/preset-panda` as an opinionated set of tokens if you don't want to define your own colors/spacing/fonts etc.

```js
export default defineConfig({
  // ...
  presets: ['@pandacss/preset-panda']
})
```

> Note: You don't need to install `@pandacss/preset-base` or `@pandacss/preset-panda`. Panda will automatically resolve them for you.
