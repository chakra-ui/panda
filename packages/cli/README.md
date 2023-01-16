Panda => Compiler for CSS System

- `tokens`
- `utilities` => css({})
- `patterns`
  - stack
  - wrap
  - inline
  - spacer
  - gradient(direction, from, to, text?)

```jsx
import { stack } from './generated/patterns'

function App() {
  return <button className={stack({ direction: 'row', spacing: '10' })}>Click me</button>
}
```

- `recipes` =>
  - buttonStyle(sizes, variants)
  - textStyle(lineClamp, size, casing)
  - surfaceStyle(hover, selected, checked, disabled)

```jsx
import { buttonStyle } from './generated/recipes'

function App() {
  return <button className={buttonStyle({ size: { base: 'lg', md: 'sm' }, variant: 'solid' })}>Click me</button>
}
```

Build. Document. Report

## Build

Generates the initial artifacts

```sh
panda init
```

Start watch mode

```sh
panda
# panda src/*.jsx --watch
```

Flags

- `--help`: usage info
- `--version`, `-v`: version number
- `--config`, `-c`: path to config file
- `--cwd`: path to config file
- `--clearCache`: remove the config cache
- `--outdir`, `-o`: output dir for generated artifacts
- `--watch`, `-w`: watch directory and rebuild
- `--exclude`: file glob to exclude from build

## Document

https://nordhealth.design/

- Tokens
- Semantic Tokens
- Recipes
- Patterns
- Playground

```sh
panda studio
```

Command

- `build`: generate bundle

Flag (for serve)

- `--port`: port number
- `--watch`: watch config and rebuild studio
- `--outdir`: output directory for build

## Report

How much tokens are used in the project?

- Token coverage
- Pattern coverage
- Recipe coverage

The impact of changes to the project (or files)

- Token changes
- Pattern changes
- Recipe changes

- CLI
- Github actions

```sh
panda report <tokens|pattern|recipe>
```

Flag

- `--reporter`: can be json,junit, html
