---
title: The extend keyword
description: What is and how to to use the extend keyword
---

The `extend` keyword allows you to extend the default Panda configuration. It is useful when you want to add your own customizations to Panda, without erasing the default `presets` values (`conditions`, `tokens`, `utilities`, etc).

It will (deeply) merge your customizations with the default ones, instead of replacing them.

The `extend` keyword allows you to extend the following parts of Panda:

- [conditions](/docs/customization/conditions)
- [theme](/docs/customization/theme)
- [recipes](/docs/concepts/recipes) (included in theme)
- [patterns](/docs/customization/patterns)
- [utilities](/docs/customization/utilities)
- [globalCss](/docs/concepts/writing-styles#global-styles)
- [staticCss](/docs/guides/static)

> These keys are all allowed in [presets](/docs/customization/presets).

## Example

After running the `panda init` command you should see something similar to this:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...

  // Useful for theme customization
  theme: {
    extend: {} // 👈 it's already there! perfect, now you just need to add your customizations in this object
  }

  // ...
})
```

Let's say you want to add a new color to the default theme. You can do it like this:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        primary: { value: '#ff0000' }
      }
    }
  }
})
```

This will add a new color to the default theme, without erasing the other ones.

Now, let's say we want to create new property `br` that applies a border radius to an element.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  utilities: {
    extend: {
      br: {
        className: 'rounded', // css({ br: "sm" }) => rounded-sm
        values: 'radii', // connect values to the radii tokens
        transform(value) {
          return { borderRadius: value }
        }
      }
    }
  }
})
```

What if this utility was coming from a preset (`@acme/my-preset`) ? You can extend any specific part, as it will be deeply merged with the existing one:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@acme/my-preset']
  utilities: {
    extend: {
      br: {
        className: 'br' // css({ br: "sm" }) => br-sm
      }
    }
  }
})
```

## Removing something from a preset

Let's say you want to remove the `br` utility from the `@acme/my-preset` preset. You can do it like this:

```ts
import { defineConfig } from '@pandacss/dev'
import myPreset from '@acme/my-preset'

const { br, ...utilities } = myPreset.utilities

export default defineConfig({
  presets: ['@acme/my-preset']
  utilities: {
    extend: {
      ...utilities, // 👈 we still want the other utilities from this preset
      // your customizations here
    }
  }
})
```

## Removing something from the base presets

Let's say you want to remove the `stack` pattern from the `@pandacss/preset-base` preset (included by default).

You can pick only the parts that you need with and spread the rest, like this:

```ts
import pandaBasePreset from '@pandacss/preset-base'

// omitting stack here
const { stack, ...pandaBasePresetPatterns } = pandaBasePreset.patterns

export default defineConfig({
  presets: ['@pandacss/preset-panda'], // 👈 we still want the tokens, breakpoints and textStyles from this preset

  // ⚠️ we need to eject to prevent the `@pandacss/preset-base` from being resolved
  // https://panda-css.com/docs/customization/presets#which-panda-presets-will-be-included-
  eject: true,
  patterns: {
    extend: {
      ...pandaBasePresetPatterns
      // your customizations here
    }
  }
})
```

## Minimal setup

If you want to use Panda with the bare minimum, without any of the defaults, you can read more about it [here](/docs/guide/minimal-setup)

## FAQ

### Why is my preset overriding the base one, even after adding it to the array?

You might have forgotten to include the `extend` keyword in your config. Without `extend`, your preset will completely replace the base one, instead of merging with it.
