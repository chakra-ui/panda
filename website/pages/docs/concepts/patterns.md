---
title: Patterns
description: Patterns are layout primitives that can be used to create robust and responsive layouts with ease. Panda comes with predefined patterns like stack, hstack, vstack, wrap, etc. These patterns can be used as functions or JSX elements.
---

# Patterns

Patterns are layout primitives can be used to create robust and responsive layouts with ease. Panda comes with
predefined patterns like stack, hstack, vstack, wrap, etc. These patterns can be used as functions or JSX elements.

> Think of patterns as a set of predefined styles to reduce repetition and improve readability. You can override the properties as needed, just like in the `css` function.

## Predefined Patterns

### Container

The Container pattern is used to create a container with a max-width and center the content.

By default, the container sets the following properties:

- `maxWidth: 8xl`
- `marginX: auto`
- `position: relative`
- `paddingX: { base: 4, md: 6, lg: 8 }`

```tsx
import { container } from '../styled-system/patterns'

function App() {
  return (
    <div className={container()}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

### Stack

The Stack pattern is a layout primitive that can be used to create a vertical or horizontal stack of elements.

The `stack` function accepts the following properties:

- `direction`: The flex direction of the stack. Can be either `vertical` or `horizontal`.
- `gap`: The gap between the elements in the stack.
- `align`: An alias for the css `align-items` property.
- `justify`: An alias for the css `justify-content` property.

```tsx
import { stack } from '../styled-system/patterns'

function App() {
  return (
    <div className={stack({ gap: '6', padding: '4' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

#### HStack

The HStack pattern is a wrapper around the `stack` pattern that sets the `direction` property to `horizontal`, and
centers the elements vertically.

```tsx
import { hstack } from '../styled-system/patterns'

function App() {
  return (
    <div className={hstack({ gap: '6' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

#### VStack

The VStack pattern is a wrapper around the `stack` pattern that sets the `direction` property to `vertical`, and centers
the elements horizontally.

```tsx
import { vstack } from '../styled-system/patterns'

function App() {
  return (
    <div className={vstack({ gap: '6' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

### Wrap

The Wrap pattern is used to add space between elements and wraps automatically if there isn't enough space.

The `wrap` function accepts the following properties:

- `gap`: The gap between the elements in the stack.
- `columnGap`: The gap between the elements in the stack horizontally.
- `rowGap`: The gap between the elements in the stack vertically.
- `align`: An alias for the css `align-items` property.
- `justify`: An alias for the css `justify-content` property.

```tsx
import { wrap } from '../styled-system/patterns'

function App() {
  return (
    <div className={wrap({ gap: '6' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

### Aspect Ratio

The Aspect Ratio pattern is used to create a container with a fixed aspect ratio. It is used when displaying images,
maps, videos and other media.

> **Note:** In most cases, we recommend using the `aspectRatio` property instead of the pattern.

The `aspectRatio` function accepts the following properties:

- `ratio`: The aspect ratio of the container. Can be a number or a string.

```tsx
import { aspectRatio } from '../styled-system/patterns'

function App() {
  return (
    <div className={aspectRatio({ ratio: 16 / 9 })}>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m1"
        title="Google map"
        frameBorder="0"
      />
    </div>
  )
}
```

### Flex

The Flex pattern is used to create a flex container and provides some shortcuts for the `flex` property.

The `flex` function accepts the following properties:

- `direction`: The flex direction of the container. Can be `row`, `column`, `row-reverse` or `column-reverse`.
- `wrap`: Whether to wrap the flex items. The value is a boolean.
- `align`: An alias for the css `align-items` property.
- `justify`: An alias for the css `justify-content` property.
- `basis`: An alias for the css `flex-basis` property.
- `grow`: An alias for the css `flex-grow` property.
- `shrink`: An alias for the css `flex-shrink` property.

```tsx
import { flex } from '../styled-system/patterns'

function App() {
  return (
    <div className={flex({ direction: 'row', align: 'center' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

### Center

The Center pattern is used to center the content of a container.

The `center` function accepts the following properties:

- `inline`: Whether to use `inline-flex` or `flex` for the container. The value is a boolean.

```tsx
import { center } from '../styled-system/patterns'

function App() {
  return (
    <div className={center({ bg: 'red.200' })}>
      <Icon />
    </div>
  )
}
```

### Float

The Float pattern is used to anchor an element to the top, bottom, left or right of the container.

> It requires a parent element with `position: relative` styles.

The `float` function accepts the following properties:

- `placement`: The placement of the element. Can be `top-start`, `top`, `top-end`, `bottom-start`, `bottom`,
  `bottom-end`, `left-start`, `left`, `left-end`, `right-start`, `right` or `right-end`.
- `offset`: The offset of the element from the edge of the container. Can be a number or a string.
- `offsetX`: Same as `offset`, but only for the horizontal axis.
- `offsetY`: Same as `offset`, but only for the vertical axis.

```tsx
import { css } from '../styled-system/css'
import { float } from '../styled-system/patterns'

function App() {
  return (
    <div className={css({ position: 'relative' })}>
      <div className={float({ placement: 'top-start' })}>3</div>
    </div>
  )
}
```

### Grid

The Grid pattern is used to create a grid layout.

The `grid` function accepts the following properties:

- `columns`: The number of columns in the grid.
- `gap`: The gap between the elements in the stack.
- `columnGap`: The gap between the elements in the stack horizontally.
- `rowGap`: The gap between the elements in the stack vertically.
- `minChildWidth`: The minimum width of the child elements before wrapping.

```tsx
import { grid } from '../styled-system/patterns'

function App() {
  return (
    <div className={grid({ columns: 3, gap: '6' })}>
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

#### Grid Item

The Grid Item pattern is used to style the children of a grid container.

The `gridItem` function accepts the following properties:

- `colSpan`: The number of columns the item spans.
- `rowSpan`: The number of rows the item spans.
- `rowStart`: The row the item starts at.
- `rowEnd`: The row the item ends at.
- `colStart`: The column the item starts at.
- `colEnd`: The column the item ends at.

```tsx
import { grid, gridItem } from '../styled-system/patterns'

function App() {
  return (
    <div className={grid({ columns: 3, gap: '6' })}>
      <div className={gridItem({ colSpan: 2 })}>First</div>
      <div>Second</div>
      <div>Third</div>
    </div>
  )
}
```

### Divider

The Divider pattern is used to create a horizontal or vertical divider.

The `divider` function accepts the following properties:

- `orientation`: The orientation of the divider. Can be `horizontal` or `vertical`.
- `thickness`: The thickness of the divider. Can be a sizing token, or arbitrary value.
- `color`: The color of the divider. Can be a color token, or arbitrary value.

```tsx
import { divider, stack } from '../styled-system/patterns'

function App() {
  return (
    <div className={stack()}>
      <button>First</button>
      <div className={divider({ orientation: 'horizontal' })} />
      <button>Second</button>
    </div>
  )
}
```

### Circle

The Circle pattern is used to create a circle.

The `circle` function accepts the following properties:

- `size`: The size of the circle. Can be a sizing token, or arbitrary value.

```jsx
import { circle } from '../styled-system/patterns'

function App() {
  return <div className={circle({ size: '12', bg: 'red.300' })} />
}
```

### Square

The Square pattern is used to create a square with equal width and height.

The `square` function accepts the following properties:

- `size`: The size of the square. Can be a sizing token, or arbitrary value.

```jsx
import { square } from '../styled-system/patterns'

function App() {
  return <div className={square({ size: '12', bg: 'red.300' })} />
}
```

### Visually Hidden

The Visually Hidden pattern is used to hide an element visually, but keep it accessible to screen readers.

```tsx
import { visuallyHidden } from '../styled-system/patterns'

export function Checkbox() {
  return (
    <label>
      <input type="checkbox" className={visuallyHidden()}>
        I'm hidden
      </input>
      <span>Checkbox</span>
    </label>
  )
}
```

### Bleed

The Bleed pattern is used to create a full width element by negating the padding applied to its parent container.

The `bleed` function accepts the following properties:

- `inline`: The amount of padding to negate on the horizontal axis. Should match the parent's padding.
- `block`: The amount of padding to negate on the vertical axis. Should match the parent's padding.

```tsx
import { css } from '../styled-system/css'
import { bleed } from '../styled-system/patterns'

export function Page() {
  return (
    <div className={css({ px: '6' })}>
      <div className={bleed({ inline: '6' })}>Welcome</div>
    </div>
  )
}
```

## Usage with JSX

To use the pattern in JSX, you need to set the `jsxFramework` property in the config. When this is set, Panda will emit
files for JSX elements based on the framework.

Every pattern can be used as a JSX element and imported from the `/jsx` entrypoint. By default, the pattern name is the
function name in PascalCase. You can override both the component name (with the `jsx` config property) and the element rendered (with the `jsxElement` config property).

Learn more about pattern customization [here](/docs/customization/patterns).

```tsx
import { VStack, Center } from '../styled-system/jsx'

function App() {
  return (
    <VStack gap="6" mt="4">
      <div>First</div>
      <div>Second</div>
      <div>Third</div>
      <Center>4</Center>
    </VStack>
  )
}
```
