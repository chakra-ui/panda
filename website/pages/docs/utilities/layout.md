---
title: Layout
description: Panda provides style properties for styling layout of an element
---

# Layout

Panda provides style properties for styling layout of an element

## Aspect Ratio

Use the `aspectRatio` utilities to set the desired aspect ratio of an element.

Values can be `square`, `portrait`, `landscape`, `widescreen`, `cinema`, `golden` or a number.

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
