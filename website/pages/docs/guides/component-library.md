---
title: Using Panda in a Component Library
description: How to set up Panda in a component library
---

# Using Panda in a Component Library

When creating a component library that uses Panda which can be used in a variety of different projects, you have four options:

1. Ship a Panda [preset](/docs/customization/presets)
2. Ship a static CSS file
3. Use Panda as external package, and ship the src files
4. Use Panda as external package, and ship the build info file

> In the examples below, we use `tsup` as the build tool. You can use any other build tool.

## Recommendations

- Library Code shouldn't be published on npm and App code uses Panda, use [ship build info](#ship-the-build-info-file) approach
- App code might not use Panda, use the [static css](#ship-a-static-css-file) file approach
- App code lives in an internal monorepo, use the [include src files](#include-the-src-files) approach
- Library code doesn't ship components but only ships tokens, patterns or recipes, use the [ship preset](#ship-a-panda-preset) approach

> ⚠️ If you use the `include src files` or `ship build info` approach, you might also need to ship a `preset` if your library code has any custom tokens, patterns or recipes.

## Ship a Panda Preset

This is the simplest approach. You can include the token, semantic tokens, text styles, etc. within a preset and consume them in your projects.

**Library code**

```tsx filename="src/index.ts"
import { definePreset } from '@pandacss/dev'

export const acmePreset = definePreset({
  theme: {
    extend: {
      tokens: {
        colors: { primary: { value: 'blue.500' } }
      }
    }
  }
})
```

Build the preset code

```bash
pnpm tsup src/index.ts
```

**App code**

```tsx filename="panda.config.ts"
import { acmePreset } from '@acme-org/panda-preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  presets: ['@pandacss/dev/presets', acmePreset]
})
```

> Adding a preset will remove the default theme from Panda. To add it back, you need to include the `@pandacss/dev/presets` preset.

## Ship a Static CSS File

This approach involves extracting the static css of your library at build time. Then you can import the CSS file in your app code.

**Library code**

```tsx filename="src/index.tsx"
import { css } from '../styled-system/css'

export function Button({ children }) {
  return (
    <button type="button" className={css({ bg: 'red.300', px: '2', py: '3' })}>
      {children}
    </button>
  )
}
```

Then you can build the library code and generate the static CSS file:

```bash
# build the library code
tsup src/index.tsx

# generate the static CSS file
panda cssgen --outfile dist/styles.css
```

Finally, don't forget to include the [cascade layers](/docs/concepts/cascade-layers) as well in your app code:

**App code**

```tsx filename="src/App.tsx"
import { Button } from '@acme-org/design-system'
import './main.css'

export function App() {
  return <Button>Click me</Button>
}
```

**main.css**

```css filename="src/main.css"
@layer reset, base, tokens, recipes, utilities;
@import url('@acme-org/design-system/dist/styles.css');

/* Your own styles here */
```

This approach comes with a few downsides:

- You can't customize the styles since the css is already generated
- You might need add the [prefix](/docs/references/config#prefix) option to avoid className conflicts

  ```tsx filename="panda.config.ts"
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    //...
    prefix: 'acme'
  })
  ```

- You might have duplicate CSS classes when using multiple atomic css libraries

## Use Panda as external package

### Summary

- create a Panda [preset](docs/customization/presets) so that you (and your users) can share the same design system tokens
- create a workspace package for your outdir (`@acme-org/styled-system`) and use that package name as the `importMap` in your app code
- have your component library (`@acme-org/components`) use the `@acme-org/styled-system` package as external

---

Let's make a dedicated workspace package for your `outdir`:

1. Create a new directory `packages/styled-system` (or any other name)
2. Install `@pandacss/dev` as a dev dependency
3. Run the `panda init` command in there to generate a `panda.config.ts` file, don't forget to set the `jsxFramework` if needed
4. [optional] you might want to install and import your [preset](docs/customization/presets) in this `panda.config.ts` file as well
5. Run the [`panda emit-pkg`](/docs/references/cli#emit-pkg) command to set the entrypoints in [`exports`](https://nodejs.org/api/packages.html#exports)

This should look similar to this:

```json
{
  "name": "@acme-org/styled-system",
  "version": "1.0.0",
  "devDependencies": {
    "@pandacss/dev": "^0.27.3"
  },
  "exports": {
    "./css": {
      "types": "./css/index.d.ts",
      "require": "./css/index.mjs",
      "import": "./css/index.mjs"
    },
    "./tokens": {
      "types": "./tokens/index.d.ts",
      "require": "./tokens/index.mjs",
      "import": "./tokens/index.mjs"
    },
    "./types": {
      "types": "./types/index.d.ts",
      "require": "./types/index.mjs",
      "import": "./types/index.mjs"
    },
    "./patterns": {
      "types": "./patterns/index.d.ts",
      "require": "./patterns/index.mjs",
      "import": "./patterns/index.mjs"
    },
    "./recipes": {
      "types": "./recipes/index.d.ts",
      "require": "./recipes/index.mjs",
      "import": "./recipes/index.mjs"
    },
    "./jsx": {
      "types": "./jsx/index.d.ts",
      "require": "./jsx/index.mjs",
      "import": "./jsx/index.mjs"
    },
    "./styles.css": "./styles.css"
  }
}
```

Going forward, you'll now import the functions from the `@acme-org/styled-system` monorepo package.

```tsx
import { css } from '@acme-org/styled-system/css'

export function Button({ children }) {
  return (
    <button type="button" className={css({ bg: 'red.300', px: '2', py: '3' })}>
      {children}
    </button>
  )
}
```

**App code**

Install the newly created `@acme-org/styled-system` package in your app code.

```bash
pnpm add @acme-org/styled-system
```

Configure the `importMap` in your `panda.config.ts` to match the `name` field of your outdir `package.json`. This will inform Panda which imports belong to the `styled-system`.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  importMap: '@acme-org/styled-system',
  outdir: 'styled-system'
})
```

Mark the `@acme-org/styled-system` as an external package in your library build tool. This ensures that the generated JS runtime code is imported only once, avoiding duplication.

```bash
tsup src/index.tsx --external @acme-org/styled-system
```

### Include the src files

Include the `src` directory from the library code in the panda config.

```tsx {6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  include: ['../@acme-org/design-system/src/**/*.tsx', './src/**/*.{ts,tsx}'],
  importMap: '@acme-org/styled-system',
  outdir: 'styled-system'
})
```

### Ship the build info file

This approach is similar to the previous one, but instead of shipping the source code, you ship the Panda build info file. This will have **the exact same end-result** as adding the sources files in the `include`, but it will allow you not to ship the source code.

The build info file is a JSON file that **only** contains the information about the static extraction result, you still need to ship your app build/dist by yourself. It can be used by Panda to generate CSS classes without the need for parsing the source code.

Generate the build info file:

```bash
panda ship --outfile dist/panda.buildinfo.json
```

**App code**

Install the newly created `@acme-org/styled-system` package in your app code.

```bash
pnpm add @acme-org/styled-system
```

Configure the `importMap` in your `panda.config.ts` to match the `name` field of your outdir `package.json`. This will inform Panda which imports belong to the `styled-system`.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  importMap: '@acme-org/styled-system',
  outdir: 'styled-system'
})
```

Will allow imports like:

```tsx
import { css } from '@acme-org/styled-system/css'
import { button } from '@acme-org/styled-system/recipes'
```

Next, you need to include the build info file from the library code in the panda config.

```tsx {6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  include: [
    './node_modules/@acme-org/design-system/dist/panda.buildinfo.json',
    './src/**/*.{ts,tsx}'
  ],
  importMap: '@acme-org/styled-system',
  outdir: 'styled-system'
})
```

## FAQ

### Why should my component library use an external package `styled-system`?

By de-coupling the component library from the `styled-system`, your users can share the same runtime code between your library and their app code.

```tsx filename="component-lib/src/button.tsx"
import { css } from '@acme-org/styled-system/css'

export function Button({ children, css: cssProp }) {
  return (
    <button
      type="button"
      className={css({ bg: 'red.300', px: '2', py: '3' }, cssProp)}
    >
      {children}
    </button>
  )
}
```

```tsx filename="app/src/App.tsx"
import { Button } from '@acme-org/design-system'
import { css } from '@acme-org/styled-system/css'

export function App() {
  return <Button css={{ color: 'white' }}>Click me</Button>
}
```

Marking the `styled-system` as an external package in your build tool means that the generated JS runtime code (the `css` function is the example above) is imported only once, avoiding duplication.

````

### How do I use the `@acme-org/styled-system` package ?

You can use your monorepo workspace package `@acme-org/styled-system` just like any other dependency in your app or component library code.

```bash
pnpm add @acme-org/styled-system
````

Set the `importMap` in your `panda.config.ts` to that same package name. This will inform Panda which imports belong to the `styled-system`.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  importMap: '@acme-org/styled-system'
})
```

Then you can import the functions from the `@acme-org/styled-system` monorepo package.

```tsx
import { css } from '@acme-org/styled-system/css'

export function Button({ children }) {
  return (
    <button type="button" className={css({ bg: 'red.300', px: '2', py: '3' })}>
      {children}
    </button>
  )
}
```

### How to override tokens used by the `@acme-org/styled-system` package?

You can override the tokens used by the `@acme-org/styled-system` package by extending the `theme` in your `panda.config.ts` file.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  presets: ['@acme-org/preset']
  theme: {
    extend: {
      tokens: {
        colors: { primary: { value: 'blue.500' } }
      }
    }
  }
})
```

## Troubleshooting

- When using `tsup` or any other build tool for your component library, if you run into a module resolution error that looks similar to `ERROR: Could not resolve "../styled-system/xxx"`. Consider setting the `outExtension`in the panda config to`js`

- If you use Yarn PnP, you might need to set the `nodeLinker: node-modules` in the `.yarnrc.yml` file.
