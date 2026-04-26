---
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/config': minor
'@pandacss/generator': minor
---

### Added: Multi-block conditions with object syntax

Allow a single condition to generate multiple independent CSS blocks using a declarative object syntax with `@slot` markers.

This is useful for defining conditions like hover-for-desktop + active-for-touch in one condition, where each block needs its own at-rule.

**Config:**

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  conditions: {
    extend: {
      hoverActive: {
        '@media (hover: hover)': {
          '&:is(:hover, [data-hover])': '@slot',
        },
        '@media (hover: none)': {
          '&:is(:active, [data-active])': '@slot',
        },
      },
    },
  },
})
```

**Usage:**

```ts
css({ _hoverActive: { bg: 'red' } })
```

**Generated CSS:**

```css
@media (hover: hover) {
  .hoverActive\:bg_red:is(:hover, [data-hover]) {
    background: red;
  }
}
@media (hover: none) {
  .hoverActive\:bg_red:is(:active, [data-active]) {
    background: red;
  }
}
```

This is backward compatible — existing `string` and `string[]` conditions continue to work as before.
