---
'@pandacss/types': minor
---

Deprecates `emitPackage`, it will be removed in the next major version.

## Why?

It's known for causing several issues:

- bundlers sometimes eagerly cache the `node_modules`, leading to `panda codegen` updates to the `styled-system` not
  visible in the browser
- auto-imports are not suggested in your IDE.
- in some IDE the typings are not always reflected properly

## As alternatives, you can use:

- relative paths instead of absolute paths (e.g. `../styled-system/css` instead of `styled-system/css`)
- use [package.json #imports](https://nodejs.org/api/packages.html#subpath-imports) and/or tsconfig path aliases (prefer
  package.json#imports when possible, TS 5.4 supports them by default) like `#styled-system/css` instead of
  `styled-system/css`
- for a [component library](https://panda-css.com/docs/guides/component-library), use a dedicated workspace package
  (e.g. `@acme/styled-system`) and use `importMap: "@acme/styled-system"` so that Panda knows which entrypoint to
  extract, e.g. `import { css } from '@acme/styled-system/css'`
