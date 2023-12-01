---
title: Background
description: Panda provides the following utilities or style properties for styling background colors, gradients, and images.
---

# Background

Panda provides the following utilities or style properties for styling background colors, gradients, and images.

## Background Colors

```jsx
<div className={css({ bg: 'red.200' })} />
```

| Prop                         | CSS Property       | Token Category |
| ---------------------------- | ------------------ | -------------- |
| `bg`, `background`           | `background`       | `colors`       |
| `bgColor`, `backgroundColor` | `background-color` | `colors`       |
| `bgGradient`                 | `background-image` | `gradients`    |

## Background Gradients

Properties to create a background gradient based on color stops.

```jsx
<div
  className={css({
    bgGradient: 'to-r',
    gradientFrom: 'red.200',
    gradientTo: 'blue.200'
  })}
/>
```

| Prop           | CSS Property       | Token Category |
| -------------- | ------------------ | -------------- |
| `bgGradient`   | `background-image` | `gradients`    |
| `textGradient` | `background-image` | `gradients`    |
| `gradientFrom` | `--gradient-from`  | `colors`       |
| `gradientTo`   | `--gradient-to`    | `colors`       |
| `gradientVia`  | `--gradient-via`   | `colors`       |

## Background Position

Properties for controlling the src and position of a background image.

```jsx
<div
  className={css({
    bgImage: 'url(/images/bg.jpg)',
    bgPosition: 'center'
  })}
/>
```

| Prop                                   | CSS Property        | Token Category |
| -------------------------------------- | ------------------- | -------------- |
| `bgPosition`, `backgroundPosition`     | `background-image`  | none           |
| `bgPositionX`, `backgroundPositionX`   | `background-image`  | none           |
| `bgPositionY`, `backgroundPositionY`   | `background-image`  | none           |
| `bgAttachment` ,`backgroundAttachment` | `background-size`   | none           |
| `bgClip`, `backgroundClip`             | `background-size`   | none           |
| `bgOrigin`, `backgroundOrigin`         | `background-size`   | none           |
| `bgImage`, `backgroundImage`           | `background-size`   | assets         |
| `bgRepeat`, `backgroundRepeat`         | `background-repeat` | none           |
| `bgBlendMode`, `backgroundBlendMode`   | `background-size`   | none           |
| `bgSize`, `backgroundSize`             | `background-size`   | none           |
