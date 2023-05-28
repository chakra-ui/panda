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
  presets: ['@acmecorp/panda-preset'],
})
```

## Creating a preset

Presets are also valid Panda configuration objects, taking a similar shape to the configuration you would add in
your `panda.config.ts` file.

```js
// my-preset.js
import { definePreset } from "@pandacss/dev";

export default definePreset({
  tokens: {
    colors: {
      rose: {
        50: { value: "#fff1f2" },
        // ...
        800: { value: "#9f2233" },
      },
    },
  },
});
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

### Asynchronous presets

There are cases where you need to perform logic to determine the content of your preset, you'd call functions to do this. In cases where they're asynchronous; panda allows promises, given that they resolve to a valid preset object.

```js
// my-preset.js
export default async function myPreset() {
  const roseColors = await getRoseColors();

  return definePreset({
    tokens: {
      colors: {
        rose: roseColors,
      },
    },
  });
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