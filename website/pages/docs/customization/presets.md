---
title: Presets
description: Creating your own reusable preset for utilities and theme
---

# Presets

By default, any configuration you add in your own `panda.config.js` file is smartly merged with the
[default configuration](#), allowing your override or extend specific parts of the configuration.

You can specify a preset in your `panda.config.js` file by using the `presets` option:

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@acmecorp/panda-preset']
})
```

## Creating a preset

Presets are also valid Panda configuration objects, taking a similar shape to the configuration you would add in
your `panda.config.ts` file.

```js
// my-preset.js
import { definePreset } from '@pandacss/dev'

export default definePreset({
  theme: {
    tokens: {
      colors: {
        rose: {
          50: { value: '#fff1f2' },
          // ...
          800: { value: '#9f2233' }
        }
      }
    }
  }
})
```

You can then use this preset in your `panda.config.ts` file:

```js
// panda.config.ts
import { defineConfig } from '@pandacss/dev'
import myPreset from './my-preset'

export default defineConfig({
  presets: [myPreset]
})
```

The available keys for a preset are:

- [`conditions`](/docs/concepts/conditional-styles)
- [`globalCss`](/docs/concepts/writing-styles#global-styles)
- [`patterns`](/docs/concepts/patterns)
- [`staticCss`](/docs/guides/static)
- [`theme`](/docs/customization/theme)
- [`utilities`](/docs/customization/utilities)

### Asynchronous presets

There are cases where you need to perform logic to determine the content of your preset, you'd call functions to do this. In cases where they're asynchronous; panda allows promises, given that they resolve to a valid preset object.

```js
// my-preset.js
export default async function myPreset() {
  const roseColors = await getRoseColors()

  return definePreset({
    theme: {
      tokens: {
        colors: {
          rose: roseColors
        }
      }
    }
  })
}
```

You can then use this preset in your `panda.config.ts` file:

```js
// panda.config.ts
import { defineConfig } from '@pandacss/dev'
import myPreset from './my-preset'

export default defineConfig({
  presets: [myPreset()]
})
```

## Which panda presets will be included ?

![Visual helper](/stately-presets-merging.png)

- `@pandacss/preset-base`:
  ALWAYS included if NOT using `eject: true`

- `@pandacss/preset-panda`:
  only included by default if you haven't specified the `presets` config option, otherwise you'll have to include that preset by yourself like so:

```ts
import pandaPreset from '@pandacss/preset-panda'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  presets: [pandaPreset, myCustomPreset]
})
```

## Minimal setup

If you want to use Panda with the bare minimum, without any of the defaults, you can read more about it [here](/docs/guides/minimal-setup)
