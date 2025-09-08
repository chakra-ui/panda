---
title: Writing Styles
description: Panda generates the utilities you need to style your components with confidence.
---

# Writing Styles

Using the object syntax is a fundamental approach to writing styles in Panda. It not only provides a type-safe style authoring experience, but also improves readability and ensures a consistent experience with style overrides.

## Atomic Styles

When you write styles in Panda, it generates a modern atomic stylesheet that is automatically scoped to the `@layer utilities` cascade layer.

The atomic stylesheets approach offers several advantages, such as improved code maintainability and reusability, as well as a smaller overall CSS footprint.

Panda exposes a `css` function that can be used to author styles. It accepts a style object and returns a className string.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',
  fontSize: '13px',
  padding: '10px 15px'
})

// Generated className:
// --> bg_gainsboro rounded_9999px fs_13px p_10px_15px

<div className={styles}>
  <p>Hello World</p>
</div>
```

The styles generated at build time end up like this:

```css
@layer utilities {
  .bg_gainsboro {
    background-color: gainsboro;
  }

  .rounded_9999px {
    border-radius: 9999px;
  }

  .fs_13px {
    font-size: 13px;
  }

  .p_10px_15px {
    padding: 10px 15px;
  }
}
```

### Shorthand Properties

Panda provides shorthands for common css properties to help improve the speed of development and reduce the visual density of your style declarations.

Properties like `borderRadius`, `backgroundColor`, and `padding` can be swapped to their shorthand equivalent `rounded`, `bg`, and `p`.

```jsx
import { css } from '../styled-system/css'

// BEFORE - Good
const styles = css({
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',
  fontSize: '13px',
  padding: '10px 15px'
})

// AFTER - Better
const styles = css({
  bg: 'gainsboro',
  rounded: '9999px',
  fontSize: '13px',
  p: '10px 15px'
})
```

> Shorthands are documented alongside their respective properties in the [utilities](/docs/utilities/background) section.

### Type safety

Panda is built with TypeScript and provides type safety for all style properties and shorthands. Most of the style properties are connected to either the native CSS properties or their respective token value defined as defined in the `theme` object.

```ts
import { css } from '../styled-system/css'

//                       ⤵ you'll get autocomplete for colors
const styles = css({ bg: '|' })
```

> You can also enable the `strictTokens: true` setting in the Panda configuration. This allows only token values and prevents the use of custom or raw CSS values.

- `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`, etc.
- `config.strictPropertyValues` will throw for properties that do not have config tokens, such as
  `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

> In both cases, you can use the `[xxx]` escape-hatch syntax to use custom or raw CSS values without TypeScript errors.

#### strictTokens

With `config.strictTokens` enabled, you can only use token values in your styles. This prevents the use of custom or raw CSS values.

```ts filename="panda.config.ts"
import { css } from '../styled-system/css'

css({ bg: 'red' }) // ❌ Error: "red" is not a valid token value
css({ fontSize: '123px' }) // ❌ Error: "123px" is not a valid token value

css({ bg: 'red.400' }) // ✅ Valid
css({ fontSize: '[123px]' }) // ✅ Valid, since `[123px]` is using the escape-hatch syntax
css({ content: 'abc' }) // ✅ Valid, since `content` isn't bound to a config token
```

For one-off styles, you can always use the escape-hatch syntax `[xxx]` to use custom or raw CSS values without TypeScript errors.

```ts filename="panda.config.ts"
import { css } from '../styled-system/css'

css({ bg: '[red]' }) // ✅ Valid, since `[red]` is using the escape-hatch syntax
css({ fontSize: '[123px]' }) // ✅ Valid, since `[123px]` is using the escape-hatch syntax
```

#### strictPropertyValues

With `config.strictPropertyValues` enabled, you can only use valid CSS values for properties that do have a predefined list of values in your styles. This prevents the use of custom or raw CSS values.

```ts filename="panda.config.ts"
css({ display: 'flex' }) // ✅ Valid
css({ display: 'block' }) // ✅ Valid

css({ display: 'abc' }) // ❌ will throw since 'abc' is not part of predefined values of 'display'
css({ pos: 'absolute123' }) // ❌ will throw since 'absolute123' is not part of predefined values of 'position'
css({ display: '[var(--btn-display)]' }) // ✅ Valid, since `[var(--btn-display)]` is using the escape-hatch syntax

css({ content: '""' }) // ✅ Valid, since `content` does not have a predefined list of values
css({ flex: '0 1' }) // ✅ Valid, since `flex` does not have a predefined list of values
```

The `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

```ts
type StrictableProps =
  | 'alignContent'
  | 'alignItems'
  | 'alignSelf'
  | 'all'
  | 'animationComposition'
  | 'animationDirection'
  | 'animationFillMode'
  | 'appearance'
  | 'backfaceVisibility'
  | 'backgroundAttachment'
  | 'backgroundClip'
  | 'borderCollapse'
  | 'border'
  | 'borderBlock'
  | 'borderBlockEnd'
  | 'borderBlockStart'
  | 'borderBottom'
  | 'borderInline'
  | 'borderInlineEnd'
  | 'borderInlineStart'
  | 'borderLeft'
  | 'borderRight'
  | 'borderTop'
  | 'borderBlockEndStyle'
  | 'borderBlockStartStyle'
  | 'borderBlockStyle'
  | 'borderBottomStyle'
  | 'borderInlineEndStyle'
  | 'borderInlineStartStyle'
  | 'borderInlineStyle'
  | 'borderLeftStyle'
  | 'borderRightStyle'
  | 'borderTopStyle'
  | 'boxDecorationBreak'
  | 'boxSizing'
  | 'breakAfter'
  | 'breakBefore'
  | 'breakInside'
  | 'captionSide'
  | 'clear'
  | 'columnFill'
  | 'columnRuleStyle'
  | 'contentVisibility'
  | 'direction'
  | 'display'
  | 'emptyCells'
  | 'flexDirection'
  | 'flexWrap'
  | 'float'
  | 'fontKerning'
  | 'forcedColorAdjust'
  | 'isolation'
  | 'lineBreak'
  | 'mixBlendMode'
  | 'objectFit'
  | 'outlineStyle'
  | 'overflow'
  | 'overflowX'
  | 'overflowY'
  | 'overflowBlock'
  | 'overflowInline'
  | 'overflowWrap'
  | 'pointerEvents'
  | 'position'
  | 'resize'
  | 'scrollBehavior'
  | 'touchAction'
  | 'transformBox'
  | 'transformStyle'
  | 'userSelect'
  | 'visibility'
  | 'wordBreak'
  | 'writingMode'
```

## Nested Styles

Panda provides different ways of nesting style declarations. You can use the native css nesting syntax, or the built-in pseudo props like `_hover` and `_focus`. Pseudo props are covered more in-depth in the next section.

### Native CSS Nesting

Panda supports the native css nesting syntax. You can use the `&` selector to create nested styles.

> **Important:** It is required to use the "&" character when nesting styles.

```jsx
<div
  className={css({
    bg: 'red.400',
    '&:hover': {
      bg: 'orange.400'
    }
  })}
/>
```

You can also target children and siblings using the `&` syntax.

```jsx
<div
  className={css({
    bg: 'red.400',
    '& span': {
      color: 'pink.400'
    }
  })}
/>
```

We recommend not using descendant selectors as they can lead to specificity issues when managing style overrides. Colocating styles directly on the element is the preferred way of writing styles in Panda.

### Using Pseudo Props

Panda provides a set of pseudo props that can be used to create nested styles. The pseudo props are prefixed with an underscore `_` to avoid conflicts with the native pseudo selectors.

For example, to create a hover style, you can use the `_hover` pseudo prop.

```jsx
<div
  className={css({
    bg: 'red.400',
    _hover: {
      bg: 'orange.400'
    }
  })}
/>
```

> See the [pseudo props](/docs/concepts/conditional-styles#reference) section for a list of all available pseudo props.

## Global styles

Global styles are useful for applying additional global resets or font faces. Use the `globalCss` property in the `panda.config.ts` file to define global styles.

Global styles are inserted at the top of the stylesheet and are scoped to the `@layer base` cascade layer.

```js filename="panda.config.ts"
import { defineConfig, defineGlobalStyles } from '@pandacss/dev'

const globalCss = defineGlobalStyles({
  'html, body': {
    color: 'gray.900',
    lineHeight: '1.5'
  }
})

export default defineConfig({
  // ...
  globalCss
})
```

The styles generated at build time will look like this:

```css
@layer base {
  html,
  body {
    color: var(--colors-gray-900);
    line-height: 1.5;
  }
}
```

### Setting global font

Set the `--global-font-body` and `--global-font-mono` CSS variables to set the body and monospace font-families.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  globalCss: {
    html: {
      '--global-font-body': 'Inter, sans-serif',
      '--global-font-mono': 'Mononoki Nerd Font, monospace'
    }
  }
})
```

### Setting the global placeholder color

Set the `--global-color-placeholder` CSS variable to set the placeholder color for all input elements.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  globalCss: {
    html: {
      '--global-color-placeholder': 'red'
    }
  }
})
```

### Setting the global border color

Set the `--global-color-border` CSS variable to set the border color for all elements.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  globalCss: {
    html: {
      '--global-color-border': 'colors.gray.400'
    }
  }
})
```

## Style Composition

### Merging styles

Passing multiple styles to the `css` function will deeply merge the styles, allowing you to override styles in a predictable way.

```jsx
import { css } from '../styled-system/css'

const result = css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })
//    ^? result = "mx_10 pt_6"
```

To design a component that supports style overrides, you can provide the `css` prop as a style object, and it'll be
merged correctly.

```tsx filename="src/components/Button.tsx"
import { css } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css(
    { display: 'flex', alignItems: 'center', color: 'black' },
    cssProp
  )
  return <button className={className}>{children}</button>
}
```

Then you can use the `Button` component like this:

```tsx filename="src/app/page.tsx"
import { Button } from './Button'

export default function Page() {
  return (
    <Button css={{ color: 'pink', _hover: { color: 'red' } }}>
      will result in `class="d_flex items_center text_pink hover:text_red"`
    </Button>
  )
}
```

---

You can use this approach as well with the `{cvaFn}.raw`, `{svaFn.raw}` and `{patternFn}.raw` functions, allowing style objects
to be merged as expected in any situation.

**Pattern Example:**

```tsx filename="src/components/Button.tsx"
import { hstack } from '../styled-system/patterns'
import { css } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  // using the flex pattern
  const hstackProps = hstack.raw({
    border: '1px solid',
    _hover: { color: 'blue.400' }
  })

  // merging the styles
  const className = css(hstackProps, cssProp)

  return <button className={className}>{children}</button>
}
```

**CVA Example:**

```tsx filename="src/components/Button.tsx"
import { css, cva } from '../styled-system/css'

const buttonRecipe = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' }
    }
  }
})

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css(
    // using the button recipe
    buttonRecipe.raw({ variant: 'primary' }),

    // adding style overrides (internal)
    { _hover: { color: 'blue.400' } },

    // adding style overrides (external)
    cssProp
  )

  return <button className={className}>{children}</button>
}
```

**SVA Example:**

```tsx filename="src/components/Button.tsx"
import { css, sva } from '../styled-system/css'

const checkbox = sva({
  slots: ['root', 'control', 'label'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', borderRadius: 'sm' },
    label: { marginStart: '2' }
  },
  variants: {
    size: {
      sm: {
        control: { width: '8', height: '8' },
        label: { fontSize: 'sm' }
      },
      md: {
        control: { width: '10', height: '10' },
        label: { fontSize: 'md' }
      }
    }
  },
  defaultVariants: {
    size: 'sm'
  }
})

export const Checkbox = ({ rootProps, controlProps, labelProps }) => {
  // using the checkbox recipe
  const slotStyles = checkbox.raw({ size: 'md' })

  return (
    <label className={css(slotStyles.root, rootProps)}>
      <input type="checkbox" className={css({ srOnly: true })} />
      <div className={css(slotStyles.control, controlProps)} />
      <span className={css(slotStyles.label, labelProps)}>Checkbox Label</span>
    </label>
  )
}

// Usage

const App = () => {
  return (
    <Checkbox
      rootProps={css.raw({ gap: 4 })}
      controlProps={css.raw({ borderColor: 'yellow.400' })}
      labelProps={css.raw({ fontSize: 'lg' })}
    />
  )
}
```

### Classname concatenation

Panda provides a simple `cx` function to join classnames. It accepts a list of classnames and returns a string.

```jsx
import { css, cx } from '../styled-system/css'

const styles = css({
  borderWidth: '1px',
  borderRadius: '8px',
  paddingX: '12px',
  paddingY: '24px'
})

const Card = ({ className, ...props }) => {
  const rootClassName = cx('group', styles, className)
  return <div className={rootClassName} {...props} />
}
```

### Hashing

When debugging or previewing DOM elements in the browser, the length of the generated atomic `className` can get quite long, and a bit annoying. If you prefer to have terser classnames, use the `hash` option to enable className and css variable name hashing.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hash: true
})
```

> You might need to generate a new code artifact by running `panda codegen --clean`

When you write a style like this:

```jsx
import { css } from '../styled-system/css'

const styles = css({
  display: 'flex',
  flexDirection: 'row',
  _hover: {
    bg: 'red.50'
  }
})
```

The hash generated css will look like:

```css
.fPSBzf {
  display: flex;
}

.ksWBqx {
  flex-direction: row;
}

.btpEVp:is(:hover, [data-hover]) {
  background: var(--bINrJX);
}
```

> We recommend that you use this in production builds only, as it can make debugging a bit harder.

## Important styles

Applying important styles works just like CSS

```js
css({
  color: 'red !important'
})
```

You can also apply important using just the exclamation syntax `!`

```js
css({
  color: 'red!'
})
```

## TypeScript

Use the `SystemStyleObject` type if you want to type your styles.

```ts {2}
import { css } from '../styled-system/css'
import type { SystemStyleObject } from '../styled-system/types'

const styles: SystemStyleObject = {
  color: 'red'
}
```

## Property conflicts

When you combine shorthand and longhand properties, Panda will resolve the styles in a predictable way. The shorthand property will take precedence over the longhand property.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  paddingTop: '20px'
  padding: "10px",
})
```

The styles generated at build time will look like this:

```css
@layer utilities {
  .p_10px {
    padding: 10px;
  }

  .pt_20px {
    padding-top: 20px;
  }
}
```

## Global vars

You can use the `globalVars` property to define global [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) or custom CSS [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) definitions.

Panda will automatically generate the corresponding CSS variables and suggest them in your style objects.

> They will be generated in the [`cssVarRoot`](/docs/references/config#cssvarroot) near your tokens.

This can be especially useful when using a 3rd party library that provides custom CSS variables, like a popper library that exposes a `--popper-reference-width`.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  globalVars: {
    '--popper-reference-width': '4px',
    // you can also generate a CSS @property
    '--button-color': {
      syntax: '<color>',
      inherits: false,
      initialValue: 'blue'
    }
  }
})
```

> Note: Keys defined in `globalVars` will be available as a value for _every_ utilities, as they're not bound to token
> categories.

```ts
import { css } from '../styled-system/css'

const className = css({
  '--button-color': 'colors.red.300',
  // ^^^^^^^^^^^^  will be suggested

  backgroundColor: 'var(--button-color)'
  //                ^^^^^^^^^^^^^^^^^^  will be suggested
})
```
