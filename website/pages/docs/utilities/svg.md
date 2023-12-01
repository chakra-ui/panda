---
title: SVG
description: Panda provides utilities for styling SVG elements.
---

# SVG

Panda provides utilities for styling SVG elements.

## Fill

Change the fill color of an SVG element.

```jsx
<svg className={css({ fill: 'blue.500' })} />
```

| Prop   | CSS Property | Token Category |
| ------ | ------------ | -------------- |
| `fill` | `fill`       | `colors`       |

## Stroke

Change the stroke color of an SVG element.

```jsx
<div className={css({ stroke: 'blue.500' })} />
```

| Prop     | CSS Property | Token Category |
| -------- | ------------ | -------------- |
| `stroke` | `stroke`     | colors         |

## Stroke Width

Change the stroke width of an SVG element.

```jsx
<div className={css({ strokeWidth: '1px' })} />
```

| Prop          | CSS Property | Token Category |
| ------------- | ------------ | -------------- |
| `strokeWidth` | `stroke-width`     | borderWidths   |
