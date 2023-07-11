---
title: Conditional Styles
description: Learn how to use conditional and responsive styles in Panda.
---

# Conditional Styles

When writing styles, you might need to apply specific changes depending on a specific condition, whether it's based on breakpoint, css pseudo state, media query or custom data attributes.

Panda allows you to write conditional styles, and provides common condition shortcuts to make your life easier. Let's say you want to change the background color of a button when it's hovered. You can do it like this:

```jsx
<button
  className={css({
    bg: 'red.500',
    _hover: { bg: 'red.700' }
  })}
>
  Hover me
</button>
```

## Overview

### Property based condition

This works great, but might be a a bit verbose. You can apply the condition `_hover` directly to the `bg` property, leading to a more concise syntax:

```diff
<button
  className={css({
-   bg: 'red.500',
-   _hover: { bg: 'red.700' }
+   bg: { base: 'red.500', _hover: 'red.700' }
  })}
>
  Hover me
</button>
```

### Nested condition

Conditions in Panda can be nested, which means you can apply multiple conditions to a single property or another condition.

Let's say you want to change the background color of a button when it's focused and hovered. You can do it like this:

```jsx
<button
  className={css({
    bg: { base: 'red.500', _hover: { _focus: 'red.700' } }
  })}
>
  Hover me
</button>
```

### Built-in conditions

Panda includes a set of common pseudo states that you can use to style your components:

- Pseudo Class: `_hover`, `_active`, `_focus`, `_focus-visible`, `_focus-within`, `_disabled`
- Pseudo Element: `_before`, `_after`
- Media Query: `sm`, `md`, `lg`, `xl`, `2xl`
- Data Attribute Selector: `_horizontal`, `_vertical`, `_portrait`, `_landscape`

## Arbitrary selectors

What if you want need a one-off selector that is not defined in your config's conditions ? You can use the `css` function to generate classes for arbitrary selectors:

```tsx
import { css } from './styled-system/css'

const App = () => {
  return (
    <div
      className={css({
        '&[data-state=closed]': { color: 'red.300' },
        '& > *': { margin: '2' }
      })}
    />
  )
}
```

This also works with the supported at-rules (`@media`, `@layer`, `@container`, `@supports`, and `@page`):

```tsx
import { css } from './styled-system/css'

const App = () => {
  return (
    <div className={css({ display: 'flex', containerType: 'size' })}>
      <div
        className={css({
          '@media (min-width: 768px)': {
            color: 'red.300'
          },
          '@container (min-width: 10px)': {
            color: 'green.300'
          },
          '@supports (display: flex)': {
            fontSize: '3xl',
            color: 'blue.300'
          }
        })}
      />
    </div>
  )
}
```

## Pseudo Classes

### Hover, Active, Focus, and Disabled

You can style the hover, active, focus, and disabled states of an element using their `_` modifier:

```jsx
<button
  className={css({
    bg: 'red.500',
    _hover: { bg: 'red.700' },
    _active: { bg: 'red.900' }
  })}
>
  Hover me
</button>
```

### First, Last, Odd, Even

You can style the first, last, odd, and even elements of a group using their `_` modifier:

```jsx
<ul>
  {items.map(item => (
    <li key={item} className={css({ _first: { color: 'red.500' } })}>
      {item}
    </li>
  ))}
</ul>
```

You can also style even and odd elements using the `_even` and `_odd` modifier:

```jsx
<table>
  <tbody>
    {items.map(item => (
      <tr
        key={item}
        className={css({
          _even: { bg: 'gray.100' },
          _odd: { bg: 'white' }
        })}
      >
        <td>{item}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## Pseudo Elements

### Before and After

You can style the `::before` and `::after` pseudo elements of an element using their `_before` and `_after` modifier:

```jsx
<div
  className={css({
    _before: { content: '"👋"' }
  })}
>
  Hello
</div>
```

> Note: Ensure you wrap the content value in double quotes.

### Placeholder

Style the placeholder text of any input or textarea using the `_placeholder` modifier:

```jsx
<input
  placeholder="Enter your name"
  className={css({
    _placeholder: { color: 'gray.500' }
  })}
/>
```

### File Inputs

Style the file input button using the `_file` modifier:

```jsx
<input
  type="file"
  className={css({
    _file: { bg: 'gray.500', px: '4', py: '2', marginEnd: '3' }
  })}
/>
```

## Media Queries

### Reduced Motion

Use the `_motionReduce` and `_motionSafe` modifiers to style an element based on the user's motion preference:

```jsx
<div
  className={css({
    _motionReduce: { transition: 'none' },
    _motionSafe: { transition: 'all 0.3s' }
  })}
>
  Hello
</div>
```

### Color Scheme

The `prefers-color-scheme` media feature is used to detect if the user has requested the system use a light or dark color theme.

Use the `_osLight` and `_osDark` modifiers to style an element based on the user's color scheme preference:

```jsx
<div
  className={css({
    bg: 'white',
    _osDark: { bg: 'black' }
  })}
>
  Hello
</div>
```

Let's say your app is dark by default, but you want to allow users to switch to a light theme. You can do it like this:

```jsx
<div
  className={css({
    bg: 'black',
    _osLight: { bg: 'white' }
  })}
>
  Hello
</div>
```

### Color Contrast

The `prefers-contrast` media feature is used to detect if the user has requested the system use a high or low contrast theme.

Use the `_highContrast` and `_lessContrast` modifiers to style an element based on the user's color contrast preference:

```jsx
<div
  className={css({
    bg: 'white',
    _highContrast: { bg: 'black' }
  })}
>
  Hello
</div>
```

### Orientation

The `orientation` media feature is used to detect if the user has a device in portrait or landscape mode.

Use the `_portrait` and `_landscape` modifiers to style an element based on the user's device orientation:

```jsx
<div
  className={css({
    pb: '4',
    _portrait: { pb: '8' }
  })}
>
  Hello
</div>
```

## Group Selectors

When you need to style an element based on its parent element's state or attribute, you can add the `group` class to the parent element, and use any of the `_group*` modifiers on the child element.

```jsx
<div className="group">
  <p className={css({ _groupHover: { bg: 'red.500' } })}>Hover me</p>
</div>
```

This modifer for every pseudo class modifiers like `_groupHover`, `_groupActive`, `_groupFocus`, and `_groupDisabled`, etc.

## Sibling Selectors

When you need to style an element based on its sibling element's state or attribute, you can add the `peer` class to the sibling element, and use any of the `_peer*` modifiers on the target element.

```jsx
<div>
  <p className="peer">Hover me</p>
  <p className={css({ _peerHover: { bg: 'red.500' } })}>I'll change by bg</p>
</div>
```

> Note: This only works for when the element marked with `peer` is a previous siblings, that is, it comes before the element you want to start.

## Data Attribute

### LTR and RTL

You can style an element based on the direction of the text using the `_ltr` and `_rtl` modifiers:

```jsx
<div dir="ltr">
  <div
    className={css({
      _ltr: { ml: '3' },
      _rtl: { mr: '3' }
    })}
  >
    Hello
  </div>
</div>
```

For this to work, you need to set the `dir` attribute on the parent element. In most cases,you can set this on the `html` element.

> **Note:** Consider using logical css properties like `marginInlineStart` and `marginInlineEnd` instead their physical counterparts like `marginLeft` and `marginRight`. This will reduce the need to use the `_ltr` and `_rtl` modifiers.

### State

You can style an element based on its `data-{state}` attribute using the corresponding `_{state}` modifier:

```jsx
<div
  data-loading
  className={css({
    _loading: { bg: 'gray.500' }
  })}
>
  Hello
</div>
```

This also works for common states like `data-active`, `data-disabled`, `data-focus`, `data-hover`, `data-invalid`, `data-required`, and `data-valid`.

```jsx
<div
  data-active
  className={css({
    _active: { bg: 'gray.500' }
  })}
>
  Hello
</div>
```

> Most of the `data-{state}` attributes typically mirror the corresponding browser pseudo class. For example, `data-hover` is equivalent to `:hover`, `data-focus` is equivalent to `:focus`, and `data-active` is equivalent to `:active`.

### Orientation

You can style an element based on its `data-orientation` attribute using the `_horizontal` and `_vertical` modifiers:

```jsx
<div
  data-orientation="horizontal"
  className={css({
    _horizontal: { bg: 'red.500' },
    _vertical: { bg: 'blue.500' }
  })}
>
  Hello
</div>
```

## ARIA Attribute

You can style an element based on its `aria-{state}=true` attribute using the corresponding `_{state}` modifier:

```jsx
<div
  aria-expanded="true"
  className={css({
    _expanded: { bg: 'gray.500' }
  })}
>
  Hello
</div>
```

> Most of the `aria-{state}` attributes typically mirror the support ARIA states in the browser pseudo class. For example, `aria-checked=true` is styled with `_checked`, `aria-disabled=true` is styled with `_disabled`.

## Reference

Here's a list of all the condition shortcuts you can use in Panda:

| Condition name         | Selector                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| \_hover                | `&:is(:hover, [data-hover])`                                       |
| \_focus                | `&:is(:focus, [data-focus])`                                       |
| \_focusWithin          | `&:focus-within`                                                   |
| \_focusVisible         | `&:is(:focus-visible, [data-focus-visible])`                       |
| \_disabled             | `&:is(:disabled, [disabled], [data-disabled])`                     |
| \_active               | `&:is(:active, [data-active])`                                     |
| \_visited              | `&:visited`                                                        |
| \_target               | `&:target`                                                         |
| \_readOnly             | `&:is(:read-only, [data-read-only])`                               |
| \_readWrite            | `&:read-write`                                                     |
| \_empty                | `&:is(:empty, [data-empty])`                                       |
| \_checked              | `&:is(:checked, [data-checked], [aria-checked=true])`              |
| \_enabled              | `&:enabled`                                                        |
| \_expanded             | `&:is([aria-expanded=true], [data-expanded])`                      |
| \_highlighted          | `&[data-highlighted]`                                              |
| \_before               | `&::before`                                                        |
| \_after                | `&::after`                                                         |
| \_firstLetter          | `&::first-letter`                                                  |
| \_firstLine            | `&::first-line`                                                    |
| \_marker               | `&::marker`                                                        |
| \_selection            | `&::selection`                                                     |
| \_file                 | `&::file-selector-button`                                          |
| \_backdrop             | `&::backdrop`                                                      |
| \_first                | `&:first-child`                                                    |
| \_last                 | `&:last-child`                                                     |
| \_only                 | `&:only-child`                                                     |
| \_even                 | `&:even`                                                           |
| \_odd                  | `&:odd`                                                            |
| \_firstOfType          | `&:first-of-type`                                                  |
| \_lastOfType           | `&:last-of-type`                                                   |
| \_onlyOfType           | `&:only-of-type`                                                   |
| \_peerFocus            | `.peer:is(:focus, [data-focus]) ~ &`                               |
| \_peerHover            | `.peer:is(:hover, [data-hover]) ~ &`                               |
| \_peerActive           | `.peer:is(:active, [data-active]) ~ &`                             |
| \_peerFocusWithin      | `.peer:focus-within ~ &`                                           |
| \_peerFocusVisible     | `.peer:is(:focus-visible, [data-focus-visible]) ~ &`               |
| \_peerDisabled         | `.peer:is(:disabled, [disabled], [data-disabled]) ~ &`             |
| \_peerChecked          | `.peer:is(:checked, [data-checked], [aria-checked=true]) ~ &`      |
| \_peerInvalid          | `.peer:is(:invalid, [data-invalid], [aria-invalid=true]) ~ &`      |
| \_peerExpanded         | `.peer:is([aria-expanded=true], [data-expanded]) ~ &`              |
| \_peerPlaceholderShown | `.peer:placeholder-shown ~ &`                                      |
| \_groupFocus           | `.group:is(:focus, [data-focus]) &`                                |
| \_groupHover           | `.group:is(:hover, [data-hover]) &`                                |
| \_groupActive          | `.group:is(:active, [data-active]) &`                              |
| \_groupFocusWithin     | `.group:focus-within &`                                            |
| \_groupFocusVisible    | `.group:is(:focus-visible, [data-focus-visible]) &`                |
| \_groupDisabled        | `.group:is(:disabled, [disabled], [data-disabled]) &`              |
| \_groupChecked         | `.group:is(:checked, [data-checked], [aria-checked=true]) &`       |
| \_groupExpanded        | `.group:is([aria-expanded=true], [data-expanded]) &`               |
| \_groupInvalid         | `.group:invalid &`                                                 |
| \_indeterminate        | `&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed])` |
| \_required             | `&:required`                                                       |
| \_valid                | `&:is(:valid, [data-valid])`                                       |
| \_invalid              | `&:is(:invalid, [data-invalid])`                                   |
| \_autofill             | `&:autofill`                                                       |
| \_inRange              | `&:in-range`                                                       |
| \_outOfRange           | `&:out-of-range`                                                   |
| \_placeholder          | `&:placeholder`                                                    |
| \_placeholderShown     | `&:placeholder-shown`                                              |
| \_pressed              | `&:is([aria-pressed=true], [data-pressed])`                        |
| \_selected             | `&:is([aria-selected=true], [data-selected])`                      |
| \_default              | `&:default`                                                        |
| \_optional             | `&:optional`                                                       |
| \_open                 | `&[open]`                                                          |
| \_fullscreen           | `&:fullscreen`                                                     |
| \_loading              | `&:is([data-loading], [aria-busy=true])`                           |
| \_currentPage          | `&[aria-current=page]`                                             |
| \_currentStep          | `&[aria-current=step]`                                             |
| \_motionReduce         | `@media (prefers-reduced-motion: reduce)`                          |
| \_motionSafe           | `@media (prefers-reduced-motion: no-preference)`                   |
| \_print                | `@media print`                                                     |
| \_landscape            | `@media (orientation: landscape)`                                  |
| \_portrait             | `@media (orientation: portrait)`                                   |
| \_dark                 | `&.dark, .dark &`                                                  |
| \_light                | `&.light, .light &`                                                |
| \_osDark               | `@media (prefers-color-scheme: dark)`                              |
| \_osLight              | `@media (prefers-color-scheme: light)`                             |
| \_highContrast         | `@media (forced-colors: active)`                                   |
| \_lessContrast         | `@media (prefers-contrast: less)`                                  |
| \_moreContrast         | `@media (prefers-contrast: more)`                                  |
| \_ltr                  | `[dir=ltr] &`                                                      |
| \_rtl                  | `[dir=rtl] &`                                                      |
| \_scrollbar            | `&::-webkit-scrollbar`                                             |
| \_scrollbarThumb       | `&::-webkit-scrollbar-thumb`                                       |
| \_scrollbarTrack       | `&::-webkit-scrollbar-track`                                       |
| \_horizontal           | `&[data-orientation=horizontal]`                                   |
| \_vertical             | `&[data-orientation=vertical]`                                     |
