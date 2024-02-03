---
title: Layout
description: Panda provides style properties for styling layout of an element
---

# Layout

Panda provides style properties for styling layout of an element

## Aspect Ratio

Use the `aspectRatio` utilities to set the desired aspect ratio of an element.

Values can reference the `aspectRatios` token category.

```jsx
<div className={css({ aspectRatio: 'square' })} />
```

> This uses the native CSS property `aspect-ratio` which is might not supported in all browsers. Consider using the [`AspectRatio` pattern](/docs/concepts/patterns#aspect-ratio) instead

## Position

Use the `position` utilities to set the position of an element.

```jsx
<div className={css({ position: 'absolute' })} />
<div className={css({ pos: 'absolute' })} /> // shorthand
```

## Top / Right / Bottom / Left

Use the `top`, `right`, `bottom` and `left` utilities to set the position of an element.

Values can reference the `spacing` token category.

```jsx
<div className={css({ position: 'absolute', top: '0', left: '0' })} />
```

| Prop     | CSS Property | Token Category |
| -------- | ------------ | -------------- |
| `top`    | `top`        | `spacing`      |
| `right`  | `right`      | `spacing`      |
| `bottom` | `bottom`     | `spacing`      |
| `left`   | `left`       | `spacing`      |

### Logical Properties

Use the `inset{Start|End}` utilities to set the position of an element based on the writing mode.

> For example, `insetStart` will set the `left` property in `ltr` mode and `right` in `rtl` mode.

```jsx
<div className={css({ position: 'absolute', insetStart: '0' })} />
```

| Prop                                      | CSS Property         | Token Category |
| ----------------------------------------- | -------------------- | -------------- |
| `start`, `insetStart`, `insetInlineStart` | `inset-inline-start` | `spacing`      |
| `end` , `insetEnd`, `insetInlineEnd`      | `inset-inline-end`   | `spacing`      |
| `insetX`, `insetInline`                   | `inset-inline`       | `spacing`      |
| `insetY`, `insetBlock`                    | `inset-inline`       | `spacing`      |

## Container Query

You can define container names and sizes in your theme configuration and use them in your styles.

```ts
export default defineConfig({
  // ...
  theme: {
    extend: {
      containerNames: ['sidebar', 'content'],
      containerSizes: {
        xs: '40em',
        sm: '60em',
        md: '80em'
      }
    }
  }
})
```

The default container sizes in the `@pandacss/preset-panda` preset are shown below:

```ts
export const containerSizes = {
  xs: '320px',
  sm: '384px',
  md: '448px',
  lg: '512px',
  xl: '576px',
  '2xl': '672px',
  '3xl': '768px',
  '4xl': '896px',
  '5xl': '1024px',
  '6xl': '1152px',
  '7xl': '1280px',
  '8xl': '1440px'
}
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
          fontSize: { '@/sm': 'md' }
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
  .\@\/sm:fs_md {
    container-type: inline-size;
  }
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
          fontSize: { base: 'lg', '@sidebar/sm': 'md' }
        })}
      />
    </nav>
  )
}
```
