---
title: Flex and Grid
description: Panda provides a set of utilities and style properties for flexible box layout (Flex) and grid layout (Grid). These utilities are designed to make it easy to create responsive and dynamic layouts in your application.
---

# Flex and Grid

Panda provides a set of utilities and style properties for flexible box layout (Flex) and grid layout (Grid). These utilities are designed to make it easy to create responsive and dynamic layouts in your application.

## Flex

Flex utilities are designed to control the layout and behavior of flex containers and items.

### Flex Basis

The `flexBasis` utility sets the initial main size of a flex item, distributing the available space along the main axis. It supports `spacing` tokens and fractional literal values like “1/2”, “2/3", etc.

```jsx
<div className={css({ basis: '1/2' })} />
```

### Flex

The `flex` utility defines the flexibility of a flex container or item.
Supported values:

| Value     |            |
| --------- | ---------- |
| `1`       | `1 1 0%`   |
| `auto`    | `1 1 auto` |
| `initial` | `0 1 auto` |
| `none`    | `none`     |

### Flex Direction

The `flexDirection` utility sets the direction of the main axis in a flex container. It's shorthand is `flexDir`.

```jsx
<div className={css({ flexDir: 'column' })} />
```

## Grid

Grid utilities offer control over various grid layout properties, providing a powerful system for creating layouts with rows and columns.

### Grid Template Columns

The `gridTemplateColumns` utility defines the columns of a grid container.
It accepts numerical values from `1` to `12` where each value maps to `repeat(<value>, minmax(0, 1fr))`

```jsx
<div className={css({ gridTemplateColumns: '3' })} />
```

### Grid Template Rows

The `gridTemplateRows` utility defines the rows of a grid container.
It accepts numerical values from `1` to `12` where each value maps to `repeat(<value>, minmax(0, 1fr))`

```jsx
<div className={css({ gridTemplateRows: '3' })} />
```
