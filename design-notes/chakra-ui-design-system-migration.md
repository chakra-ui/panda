# Chakra UI as a Panda v2 Design System

## Decision

Chakra should migrate to Panda v2 with a real Chakra-owned styled-system package:

```txt
@chakra-ui/react
@chakra-ui/styled-system
```

`@chakra-ui/react` owns the user-facing React components. `@chakra-ui/styled-system` owns Chakra's default generated
Panda runtime, declarations, preset, and build info.

Chakra components import styling helpers from the styled-system package root:

```ts
import { button } from '@chakra-ui/styled-system/recipes'
import { css, cx } from '@chakra-ui/styled-system/css'
```

`@chakra-ui/react` should depend on `@chakra-ui/styled-system`. It should not declare it as a peer dependency. Chakra
owns the default styled-system, and users should not install or version it manually.

In a Panda-aware app, Panda generates one final app-composed `styled-system` from:

```txt
Chakra preset
+ upstream design-system presets/overrides
+ app config
```

Then the app maps Chakra's styled-system package root to that generated output:

```txt
@chakra-ui/styled-system/* -> ./styled-system/*
```

This gives Chakra a real fallback package for its own repo, tests, Storybook, and non-overridden installs, while still
letting Panda apps override the runtime and declarations with app-generated artifacts.

## Why This Shape

Panda already generates category-root entrypoints:

```txt
styled-system/
  css/
  recipes/
    index.mjs
    button.mjs
    button.d.mts
  patterns/
  jsx/
  tokens/
  types/
```

`recipes/index.*` re-exports per-recipe modules, so Chakra should import recipes from:

```ts
import { button } from '@chakra-ui/styled-system/recipes'
```

This matches Panda's existing `importMap` model. It also avoids:

- runtime provider/registry indirection,
- relative imports that apps cannot override,
- mutating installed files in `node_modules`,
- making users manage a styled-system peer dependency.

## Chakra Package Setup

Inside the Chakra repo:

```txt
packages/
  react/
    package.json              # @chakra-ui/react
    src/components/
    panda.manifest.json
    panda.components.json
  styled-system/
    package.json              # @chakra-ui/styled-system
    css/
    recipes/
    patterns/
    jsx/
    tokens/
    types/
    panda.preset.js
    panda.buildinfo.json
```

`@chakra-ui/react/package.json`:

```json
{
  "dependencies": {
    "@chakra-ui/styled-system": "workspace:*"
  }
}
```

Target `@chakra-ui/styled-system` exports:

```jsonc
{
  "name": "@chakra-ui/styled-system",
  "exports": {
    "./css": "./css/index.js",
    "./css/*": "./css/*.js",
    "./recipes": "./recipes/index.js",
    "./recipes/*": "./recipes/*.js",
    "./patterns": "./patterns/index.js",
    "./patterns/*": "./patterns/*.js",
    "./jsx": "./jsx/index.js",
    "./jsx/*": "./jsx/*.js",
    "./tokens": "./tokens/index.js",
    "./types": "./types/index.d.ts",
    "./panda.preset": "./panda.preset.js",
    "./panda.buildinfo.json": "./panda.buildinfo.json"
  }
}
```

Target `@chakra-ui/react` exports:

```jsonc
{
  "exports": {
    ".": "./dist/esm/index.js",
    "./panda.manifest.json": "./dist/panda.manifest.json",
    "./panda.components.json": "./dist/panda.components.json"
  }
}
```

Chakra component code should treat `@chakra-ui/styled-system` as the only styling import boundary:

```tsx
// packages/react/src/components/button/button.tsx
import { button } from '@chakra-ui/styled-system/recipes'
import { css, cx } from '@chakra-ui/styled-system/css'
import type { SystemStyleObject } from '@chakra-ui/styled-system/types'

interface ButtonProps {
  className?: string
  css?: SystemStyleObject
  children?: React.ReactNode
}

export function Button(props: ButtonProps) {
  const { className, css: cssProp, children, ...rest } = props
  const [variantProps, localProps] = button.splitVariantProps(rest)

  return (
    <button {...localProps} className={cx(button(variantProps), css(cssProp), className)}>
      {children}
    </button>
  )
}
```

The same import resolves differently depending on the consumer:

```txt
Chakra repo / default install:
  @chakra-ui/styled-system/recipes -> @chakra-ui/styled-system/recipes

Panda-aware app:
  @chakra-ui/styled-system/recipes -> ./styled-system/recipes
```

## Chakra Manifest

`@chakra-ui/react` publishes a manifest that points Panda to the styled-system package:

```jsonc
{
  "schemaVersion": 1,
  "name": "@chakra-ui/react",
  "panda": {
    "version": "^2.0.0",
    "importMap": "@chakra-ui/styled-system",
    "preset": "@chakra-ui/styled-system/panda.preset",
    "buildInfo": "@chakra-ui/styled-system/panda.buildinfo.json",
    "components": "./panda.components.json"
  }
}
```

`importMap` is the package root used by Chakra component code. Panda uses it for extraction and for deriving the app's
runtime/type resolution plan.

## Consumer App DX

The app config should stay simple:

```ts
export default {
  designSystems: ['@chakra-ui/react'],
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: {
            500: { value: '#3b82f6' },
          },
        },
      },
      recipes: {
        button: {
          variants: {
            variant: {
              marketing: { bg: 'brand.500', color: 'white' },
            },
          },
        },
      },
    },
  },
}
```

App code remains normal Chakra:

```tsx
import { Button } from '@chakra-ui/react'

<Button colorPalette="brand" variant="marketing" />
```

The app-generated recipe reflects the merged config in **types**, **variant metadata**, and **extracted CSS** — not
inline style objects in the runtime module.

```ts
// styled-system/recipes/button.mjs
import { createRecipe } from './runtime.mjs'

const buttonConfig = {
  name: 'button',
  className: 'btn',
  defaultVariants: { variant: 'solid' },
  variantMap: {
    variant: ['solid', 'outline', 'marketing'], // merged from Chakra + app config
    size: ['sm', 'md', 'lg'],
  },
  compoundVariants: [
    // precomputed class names only — not `{ bg, color }` objects
    { variant: 'marketing', size: 'lg', className: 'btn--compound__variant_marketing__size_lg' },
  ],
}

export const button = /* @__PURE__ */ createRecipe(buttonConfig)
```

Variant styles live in the build output CSS, keyed by those class names:

```css
/* styled-system/styles.css (or styles/recipes/button.css when split) */
@layer recipes {
  .btn--variant_marketing {
    background: var(--colors-brand-500);
    color: white;
  }
}
```

At runtime, `button({ variant: 'marketing' })` returns class name strings (for example `"btn btn--variant_marketing"`),
not style objects. TypeScript picks up the merged variant keys from `button.d.mts`:

```ts
// styled-system/recipes/button.d.mts
export type ButtonVariant = {
  variant?: 'solid' | 'outline' | 'marketing'
  size?: 'sm' | 'md' | 'lg'
}
```

The app user should not import `@chakra-ui/styled-system` unless building custom components. Chakra imports it
internally, and Panda maps it to the app-generated styled-system.

Setup should be one-time and explicit:

```sh
pnpm panda init
```

or:

```sh
pnpm panda codegen --update-tsconfig
```

Normal `panda codegen` should validate and warn when required mappings are missing. It should not silently edit
`tsconfig.json` or framework config during CI/build.

## Resolution Plan

There are three separate resolution layers.

### Extraction

Panda `importMap` includes all styled-system package roots:

```ts
importMap: ['@chakra-ui/styled-system', '@acme/styled-system', 'styled-system']
```

This lets the extractor recognize imports from Chakra package source, upstream design-system source, and app source.

### Runtime

Frameworks map styled-system package roots to the generated app output:

```txt
@chakra-ui/styled-system/* -> ./styled-system/*
@acme/styled-system/*      -> ./styled-system/*
```

Vite/Nuxt can apply this in the Panda plugin. Next should use a `withPanda()` helper or documented config:

```ts
// vite.config.ts
import pandacss from '@pandacss/vite'

export default {
  plugins: [pandacss()],
  resolve: {
    alias: {
      '@chakra-ui/styled-system': '/absolute/path/to/app/styled-system',
    },
  },
}
```

Next webpack can use the same plan:

```js
// next.config.js
const path = require('node:path')

module.exports = {
  webpack(config) {
    config.resolve.alias['@chakra-ui/styled-system'] = path.resolve(__dirname, 'styled-system')
    return config
  },
}
```

Next Turbopack uses declarative aliases:

```js
module.exports = {
  turbopack: {
    resolveAlias: {
      '@chakra-ui/styled-system': './styled-system',
    },
  },
}
```

Turbopack has no Vite-style native plugin API for custom `resolveId` / `load` hooks, so this must use declarative
`next.config.js` options.

### Types

TypeScript needs matching paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@chakra-ui/styled-system/*": ["./styled-system/*"]
    }
  }
}
```

Runtime aliases alone are not enough. If TypeScript still resolves `@chakra-ui/styled-system/recipes` to the default
package declarations, app-added variants and tokens will not type-check.

Panda can generate or validate this from the same resolution plan:

```ts
{
  runtimeAliases: {
    '@chakra-ui/styled-system': '/app/styled-system',
  },
  tsPaths: {
    '@chakra-ui/styled-system/*': ['./styled-system/*'],
  },
  importMap: ['@chakra-ui/styled-system', 'styled-system'],
}
```

## Stacked Design Systems

For `design-system -> design-system -> app`, Panda resolves manifests recursively and creates one composed output.

Example:

```txt
@acme/ui extends Chakra
app designSystems: ['@acme/ui']

presets:
  Chakra preset
  Acme preset / Chakra overrides
  app config

styled-system roots:
  @chakra-ui/styled-system
  @acme/styled-system
  styled-system

runtime/type mappings:
  @chakra-ui/styled-system/* -> ./styled-system/*
  @acme/styled-system/*      -> ./styled-system/*
```

Start with one composed app styled-system. Do not introduce per-layer runtime overlays until a concrete use case proves
that the added complexity is necessary.

## Component Metadata

Build info is not enough because Chakra package source does not contain consumer-selected props:

```tsx
<Button size="sm" variant="outline" colorPalette="red" mt="4" />
```

Chakra must also publish component extraction metadata:

```jsonc
{
  "Button": {
    "kind": "recipe",
    "recipe": "button",
    "element": "button",
    "styleProps": true
  },
  "Accordion": {
    "kind": "namespace",
    "members": {
      "Root": {
        "kind": "slotRecipe",
        "recipe": "accordion",
        "slot": "root",
        "styleProps": true
      }
    }
  }
}
```

This lets Panda extract Chakra JSX usage from app source:

```tsx
import { Button, Accordion as A } from '@chakra-ui/react'

<Button variant="ghost" colorPalette="blue" px="3" />
<A.Root variant="subtle" />
```

## Runtime Direction

The goal is not zero runtime. Chakra still needs React components, Ark integration, contexts, polymorphism, `asChild`,
prop splitting, and class composition.

The goal is no runtime style insertion:

```txt
render Chakra component
  -> split props
  -> generated recipe runtime returns class names
  -> generated css runtime returns deterministic atomic class names
  -> compose className
  -> no Emotion insertion
```

CSS comes from:

- Chakra build info hydration,
- app extraction of Chakra JSX usage,
- app extraction of direct styled-system usage,
- static CSS/safelists for intentionally dynamic cases.

## Build Responsibilities

Chakra CI should produce:

1. `@chakra-ui/styled-system` generated runtime files.
2. `@chakra-ui/styled-system/panda.preset`.
3. `@chakra-ui/styled-system/panda.buildinfo.json`.
4. `@chakra-ui/react/panda.manifest.json`.
5. `@chakra-ui/react/panda.components.json`.

App build should:

1. Resolve `designSystems`.
2. Load manifests recursively.
3. Merge presets and app config in graph order.
4. Generate the final composed `styled-system`.
5. Apply or validate runtime aliases.
6. Apply or validate TypeScript paths.
7. Hydrate design-system build info.
8. Extract app source and emit CSS.

## Diagnostics

Panda should diagnose:

- Chakra component code importing relative styled-system paths.
- missing runtime alias for a styled-system package root.
- missing TypeScript path for a styled-system package root.
- incompatible duplicate styled-system package roots.
- app-added slot recipe slots without matching component APIs.
- dynamic variant/style usage without static CSS or safelist coverage.

## Open Questions

1. Should manifests live only as `panda.manifest.json`, or also under a `package.json` field?
2. How should transitive design-system extension metadata be represented?
3. How much of `panda.components.json` can be generated from Chakra source conventions?
4. What static CSS/safelist syntax is required for dynamic Chakra props?
5. Should `panda codegen --update-tsconfig` preserve comments and formatting in common `tsconfig.json` shapes?

## Definition of Done

- `@chakra-ui/react` depends on `@chakra-ui/styled-system`.
- Chakra components import style helpers from `@chakra-ui/styled-system`.
- `designSystems: ['@chakra-ui/react']` resolves Chakra preset, build info, component metadata, and styled-system package
  root.
- An app can add `colors.brand` and use `<Button colorPalette="brand" />` with correct CSS and types.
- An app can add `button.variant.marketing` and use `<Button variant="marketing" />` with correct CSS and types.
- A stacked design-system app can map both `@chakra-ui/styled-system/*` and `@acme/styled-system/*` to the final
  app-generated styled-system.
- Vite/Nuxt, Next webpack, and Next Turbopack have documented runtime alias setup.
- TypeScript path setup is generated explicitly or diagnosed clearly.
- Emotion is no longer required for style insertion in the static Panda path.
