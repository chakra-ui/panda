---
'@pandacss/preset-base': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

### Container Query Theme

Improve support for CSS container queries by adding a new `containerNames` and `containerSizes` theme options.

You can new define container names and sizes in your theme configuration and use them in your styles.

```ts
export default defineConfig({
  // ...
  theme: {
    extend: {
      containerNames: ['sidebar', 'content'],
      containerSizes: {
        xs: '40em',
        sm: '60em',
        md: '80em',
      },
    },
  },
})
```

Then use them in your styles by referencing using `@<container-name>/<container-size>` syntax:

> The default container syntax is `@/<container-size>`.

```ts
import { css } from '/styled-system/css'

function Demo() {
  return (
    <nav className={css({ containerType: 'inline-size' })}>
      <div
        className={css({
          fontSize: { '@/sm': 'md' },
        })}
      />
    </nav>
  )
}
```

This will generate the following CSS:

```css
.cq-type_inline-size {
  container-type: inline-size;
}

@container (min-width: 60em) {
  .@\/sm:fs_md {
    container-type: inline-size;
  }
}
```

### Container Query Pattern

To make it easier to use container queries, we've added a new `cq` pattern to `@pandacss/preset-base`.

```ts
import { cq } from 'styled-system/patterns'

function Demo() {
  return (
    <nav className={cq()}>
      <div
        className={css({
          fontSize: { base: 'lg', '@/sm': 'md' },
        })}
      />
    </nav>
  )
}
```

You can also named container queries:

```ts
import { cq } from 'styled-system/patterns'

function Demo() {
  return (
    <nav className={cq({ name: 'sidebar' })}>
      <div
        className={css({
          fontSize: { base: 'lg', '@sidebar/sm': 'md' },
        })}
      />
    </nav>
  )
}
```
