---
'@pandacss/compiler': patch
---

Fix `.raw()` handing back a class string instead of a style object, which broke anything composing those styles.

```ts
const button = cva({ base: { color: 'red' } })

const styles = button.raw() // was "color_red", now { color: 'red' }

css(styles, { color: 'blue' }) // merges, instead of dropping the base
```

Covers `css.raw()`, `recipe.raw()`, `pattern.raw()` and inline `cva`/`sva`. When an imported recipe's variants aren't
known at build time, Panda now warns instead of returning a string.
