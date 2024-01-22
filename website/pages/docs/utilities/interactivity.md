---
title: Interactivity
description: Panda CSS provides a variety of utility classes to enhance interactivity and user experience on your web applications.
---

# Interactivity

Panda CSS provides a variety of utility classes to enhance interactivity and user experience on your web applications. These utilities cover aspects such as accent color, caret color, scrolling behavior, scrollbar customization, scroll margins and paddings, scroll snapping, touch actions, and user selection.

## Accent Color

The `accentColor` utility class sets the accent color of an element. It supports `colors` tokens.

```jsx
<div className={css({ accentColor: 'blue.500' })}>Accent color applied</div>
```

## Caret Color

The `caretColor` utility class sets the color of the text cursor (caret) in an input or textarea. It supports `colors` tokens.

```jsx
<input className={css({ caretColor: 'red.400' })} />
```

## Scrollbar

The `scrollbar` utility allows customization of scrollbar appearance. It supports `visible` and `hidden` values which respectively show or hide the scrollbar.

```jsx
<div className={css({ scrollbar: 'hidden' })}>Scrollbar hidden</div>
```

## Scroll Margin

Scroll margin utilities set margins around scroll containers.

```jsx
<div className={css({ scrollMarginX: '2' })}>
  Scrollbar Container with Inline padding
</div>
```

| Prop                                  | CSS Property                 | Token Category |
| ------------------------------------- | ---------------------------- | -------------- |
| `scrollMarginX` ,`scrollMarginInline` | `scroll-margin-inline`       | `spacing`      |
| `scrollMarginInlineStart`             | `scroll-margin-inline-start` | `spacing`      |
| `scrollMarginInlineEnd`               | `scroll-margin-inline-end`   | `spacing`      |
| `scrollMarginY` , `scrollMarginBlock` | `scroll-margin-block`        | `spacing`      |
| `scrollMarginBlockStart`              | `scroll-margin-block-start`  | `spacing`      |
| `scrollMarginBlockEnd`                | `scroll-margin-block-end`    | `spacing`      |
| `scrollMarginLeft`                    | `scroll-margin-left`         | `spacing`      |
| `scrollMarginRight`                   | `scroll-margin-right`        | `spacing`      |
| `scrollMarginTop`                     | `scroll-margin-top`          | `spacing`      |
| `scrollMarginBottom`                  | `scroll-margin-bottom`       | `spacing`      |

## Scroll Padding

Scroll padding utilities set padding inside scroll containers.

```jsx
<div className={css({ scrollPaddingY: '2' })}>
  Scrollbar Container with block padding
</div>
```

| Prop                                     | CSS Property                  | Token Category |
| ---------------------------------------- | ----------------------------- | -------------- |
| `scrollPaddingX` , `scrollPaddingInline` | `scroll-padding-inline`       | `spacing`      |
| `scrollPaddingInlineStart`               | `scroll-padding-inline-start` | `spacing`      |
| `scrollPaddingInlineEnd`                 | `scroll-padding-inline-end`   | `spacing`      |
| `scrollPaddingY` , `scrollPaddingBlock`  | `scroll-padding-block`        | `spacing`      |
| `scrollPaddingBlockStart`                | `scroll-padding-block-start`  | `spacing`      |
| `scrollPaddingBlockEnd`                  | `scroll-padding-block-end`    | `spacing`      |
| `scrollPaddingLeft`                      | `scroll-padding-left`         | `spacing`      |
| `scrollPaddingRight`                     | `scroll-padding-right`        | `spacing`      |
| `scrollPaddingTop`                       | `scroll-padding-top`          | `spacing`      |
| `scrollPaddingBottom`                    | `scroll-padding-bottom`       | `spacing`      |

## Scroll Snapping

Scroll snapping utilities provide control over the scroll snap behavior.

### Scroll Snap Margin

| Prop                     | CSS Property           | Token Category |
| ------------------------ | ---------------------- | -------------- |
| `scrollSnapMargin`       | `scroll-margin`        | `spacing`      |
| `scrollSnapMarginTop`    | `scroll-margin-top`    | `spacing`      |
| `scrollSnapMarginBottom` | `scroll-margin-bottom` | `spacing`      |
| `scrollSnapMarginLeft`   | `scroll-margin-left`   | `spacing`      |
| `scrollSnapMarginRight`  | `scroll-margin-right`  | `spacing`      |

### Scroll Snap Strictness

It's values can be `mandatory` or `proximity` values, and maps to `var(--scroll-snap-strictness)`.

```jsx
<div className={css({ scrollSnapStrictness: 'proximity' })}>
  Scroll container with proximity scroll snap
</div>
```

### Scroll Snap Type

Supported values

| Value  |                                      |
| ------ | ------------------------------------ |
| `none` | `none`                               |
| `x`    | `x var(--scroll-snap-strictness)`    |
| `y`    | `y var(--scroll-snap-strictness)`    |
| `both` | `both var(--scroll-snap-strictness)` |
