---
title: Responsive Design
description: How to write mobile responsive designs in your CSS in Panda
---

# Responsive Design

Responsive design is a fundamental aspect of modern web development, allowing websites and applications to adapt seamlessly to different screen sizes and devices.

Panda provides a comprehensive set of responsive utilities and features to facilitate the creation of responsive layouts. It lets you do this through conditional styles for different breakpoints.

Let's say you want to change the font weight of a text on large screens, you can do it like this:

```jsx
<span
  className={css({
    fontWeight: 'medium',
    lg: { fontWeight: 'bold' }
  })}
>
  Text
</span>
```

> Panda uses a mobile-first breakpoint system and leverages min-width media queries `@media(min-width)` when you write responsive styles.

Panda provides five breakpoints by default:

```ts
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

## Overview

### Property based modifier

Panda allows you apply the responsive condition directly to a style property, resulting in a more concise syntax:

```diff
<span
  className={css({
-   fontWeight: 'medium',
-   lg: { fontWeight: 'bold' }
+   fontWeight: { base: 'medium', lg: 'bold' }
  })}
>
  Text
</span>
```

### The Array syntax

Panda also accepts arrays as values for responsive styles. Pass the corresponding value for each breakpoint in the array. Using our previous code as an example:

```jsx
<span
  className={css({
    fontWeight: ['medium', undefined, undefined, 'bold']
  })}
>
  Text
</span>
```

> We're leaving the corresponding values of the unused breakpoints `md` and `lg` as undefined.

### Targeting a breakpoint range

By default, styles assigned to a specific breakpoint will be effective at that breakpoint and will persist as applied styles at larger breakpoints.

If you wish to apply a utility exclusively when a particular range of breakpoints is active, Panda offers properties that restrict the style to that specific range. To construct the property, combine the minimum and maximum breakpoints using the "To" notation in camelCase format.

Let's say we want to apply styles between the `md` and `xl` breakpoints, we use the `mdToXl` property:

```jsx
<span
  className={css({
    fontWeight: { mdToXl: 'bold' }
  })}
>
  Text
</span>
```

> This text will only be bold in `md`, `lg` and `xl` breakpoints.

### Targeting a single breakpoint

To target a single breakpoint, you can easily achieve this by simply adding the suffix "Only" to the breakpoint name in camelCase format.

Let's say we want to apply styles only in the `lg` breakpoint, we use the `lgOnly` property:

```jsx
<span
  className={css({
    fontWeight: { lgOnly: 'bold' }
  })}
>
  Text
</span>
```

### Customizing Breakpoints

When encountering certain scenarios, it may become necessary to establish custom breakpoints tailored to your application's needs. It is advisable to utilize commonly used aliases such as `sm`, `md`, `lg`, and `xl` for this purpose.

In order to define custom breakpoints, you can easily accomplish this by passing them as an object within your Panda config.

> Note: Make sure that the CSS units of your breakpoints are consistent. Use either all pixels (`px`) or all `em`, but do not mix them.

```js filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    }
  }
})
```

### Hiding elements by breakpoint

If you need to limit the visibility of an element to any breakpoint, Panda provides [display utilities](/docs/utilities/display) to help you achieve this.
