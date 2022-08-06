## Folder structure

- `.panda`
  - `design-tokens` (index.js, index.d.ts, index.css)
  - `styled-system` (index.js, index.d.ts)
  - `package.json`

```js
import { generateCssVar, generateDts, generateJs } from '@css-panda/generator'
import { createDictionary } from '@css-panda/dictionary'

const conf = new Conf()

const dict = createDictionary(config)

const cssVars = generateCssVar(dict, { root: ':root' })
const dts = generateDts(dict)
const files = generateJs(dict, { formats: ['esm', 'cjs'] })
```

```json
{
  "name": "dot-panda",
  "description": "...",
  "exports": {
    "./design-tokens": {
      "import": "./generated/design-tokens/index.mjs"
    },
    "./css": {
      "import": "./generated/css/index.mjs"
    }
  },
  "typeVersions": {
    "*": {
      "design-tokens": ["./generated/design-tokens"],
      "css": ["./generated/css"]
    }
  }
}
```

```js
import { definePackage, writePackage } from '@css-panda/generators'

const pkg = setupPackage({
  name: 'dot-panda',
  description: '...',
  dir: 'generated',
  exports: ['design-tokens', 'css'],
})

writePackage(pkg)

updateTsConfig({
  compilerOptions: {
    paths: {
      'design-system': ['./.panda'],
    },
  },
})

updateGitIgnore({ comment: '# Panda', path: '.css-panda' })
```
