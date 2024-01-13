---
'@pandacss/config': patch
---

## Change

Change the config dependencies (files that are transitively imported) detection a bit more permissive to make it work by
default in more scenarios.

## Context

This helps when you're in a monorepo and you have a workspace package for your preset, and you want to see the HMR
reflecting changes in your app.

Currently, we only traverse files with the `.ts` extension, this change makes it traverse all files ending with `.ts`,
meaning that it will also traverse `.d.ts`, `.d.mts`, `.mts`, etc.

## Example

```ts
// apps/storybook/panda.config.ts
import { defineConfig } from '@pandacss/dev'
import preset from '@acme/preset'

export default defineConfig({
  // ...
})
```

This would not work before, but now it does.

```jsonc
{
  "name": "@acme/preset",
  "types": "./dist/index.d.mts", // we only looked into `.ts` files, so we didnt check this
  "main": "./dist/index.js",
  "module": "./dist/index.mjs"
}
```

## Notes

This would have been fine before that change.

```jsonc
// packages/preset/package.json
{
  "name": "@acme/preset",
  "types": "./src/index.ts", // this was fine
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
    // ...
  }
}
```
