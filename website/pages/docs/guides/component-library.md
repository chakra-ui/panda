---
title: Using Panda in a Component Library
description: How to set up Panda in a component library
---

# Using Panda in a Component Library

When creating a component library that uses Panda which can be used in a variety of different projects, you have four options:

1. Ship a Panda preset
2. Ship a static CSS file
3. Use Panda as external package, and ship the src files
4. Use Panda as external package, and ship the build info file

> In the examples below, we use `tsup` as the build tool. You can use any other build tool.

## Ship a Panda Preset

This is the simplest approach. You can include the token, semantic tokens, text styles, etc. within a preset and consume them in your projects.

**Library code**

```tsx filename="src/index.ts"
import { definePreset } from '@pandacss/dev'

export const acmePreset = definePreset({
  theme: {
    extend: {
      tokens: {
        colors: { primary: 'blue.500' }
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

### Ship the src files

**Library code**

Include the `src` directory of your library in the package.json `files` field:

```json filename="package.json"
{
  "name": "@acme-org/design-system",
  "files": ["src", "dist"]
}
```

Convert the `styled-system` directory to a package by setting the `emitPackage` and `outdir` properties. This will inform Panda to emit the code artifacts to the `node_modules`.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

Next, you need to run the `panda codegen` command. Going forward, you'll now import the functions from the `@acme-org/styled-system` package.

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

Mark the `@acme-org/styled-system` as an external package in your library build tool.

```bash
tsup src/index.tsx --external @acme-org/styled-system
```

**App code**

Set the `emitPackage` and `outdir` properties in your app config file to match the library config file.

```tsx {5,6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

This will inform Panda to emit the code artifacts to the `node_modules`, and create a symlink for the library code. It will also avoid duplicating the runtime JS code.

Include the `src` directory from the library code in the panda config.

```tsx {6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  include: [
    './node_modules/@acme-org/design-system/src/**/*.tsx',
    './src/**/*.{ts,tsx}'
  ],
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

### Ship the build info file

This approach is similar to the previous one, but instead of shipping the source code, you ship the Panda build info file.

The build info file is a JSON file that contains the information about the static extraction result. It can be used by Panda to generate CSS classes without the need for parsing the source code.

Convert the `styled-system` directory to a package by setting the `emitPackage` and `outdir` properties. This will inform Panda to emit the code artifacts to the `node_modules`.

```tsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

Next, you need to run the `panda codegen` command. Going forward, you'll now import the functions from the `@acme-org/styled-system` package.

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

Mark the `@acme-org/styled-system` as an external package in your library build tool.

```bash
tsup src/index.tsx --external @acme-org/styled-system
```

Generate the build info file:

```bash
panda ship --outfile dist/panda.buildinfo.json
```

**App code**

Set the `emitPackage` and `outdir` properties in your app config file to match the library config file.

```tsx {5,6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

This will inform Panda to emit the code artifacts to the `node_modules`, and create a symlink for the library code. It will avoid duplicating the runtime code.

Next, you need to include the build info file from the library code in the panda config.

```tsx {6} filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  //...
  include: [
    './node_modules/@acme-org/design-system/dist/panda.buildinfo.json',
    './src/**/*.{ts,tsx}'
  ],
  emitPackage: true,
  outdir: '@acme-org/styled-system'
})
```

## Recommendations

- Library Code uses Panda and App Code uses Panda, use [ship build info](#ship-the-build-info-file) approach
- Library Code uses Panda and App Code might not use Panda, use the [static css](#ship-a-static-css-file) file approach
- Library Code and App Code in a monorepo, use the [ship src files](#ship-the-src-files) approach
- Library Code ships only tokens, patterns or recipes, use the [ship preset](#ship-a-panda-preset) approach

## Troubleshooting

- When using `tsup` or any other build tool for your component library, if you run into a module resolution error that looks similar to `ERROR: Could not resolve "../styled-system/xxx"`. Consider setting the `outExtension`in the panda config to`js`

- If you use Yarn PnP, you might need to set the `nodeLinker: node-modules` in the `.yarnrc.yml` file.
