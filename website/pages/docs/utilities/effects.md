---
title: Effects
description: Panda provides utilities or style properties for applying various visual effects to elements.
---

# Background

Panda offers a range of utilities or style properties for applying visual effects to elements. These effects include opacity, shadows, blending modes, filters, and more.

## Opacity

```jsx
<div className={css({ opacity: 0.5 })} />
```

| Prop      | CSS Property | Token Category |
| --------- | ------------ | -------------- |
| `opacity` | `opacity`    | `opacity`      |

## Box Shadow

Apply box shadows to elements.

```jsx
<div className={css({ boxShadow: 'lg' })} />
```

| Prop          | CSS Property     | Token Category |
| ------------- | ---------------- | -------------- |
| `boxShadow`   | `box-shadow`     | `shadows`      |
| `shadow`      | `box-shadow`     | `shadows`      |
| `shadowColor` | `--shadow-color` | `colors`       |

## Mix Blend Mode

Control the blending mode of an element.

```jsx
<div className={css({ mixBlendMode: 'multiply' })} />
```

| Prop           | CSS Property     | Token Category |
| -------------- | ---------------- | -------------- |
| `mixBlendMode` | `mix-blend-mode` | none           |

## Filter

Apply various filters to elements.

```jsx
<div className={css({ filter: 'auto', blur: 'sm' })} />
```

| Prop         | CSS Property    | Token Category |
| ------------ | --------------- | -------------- |
| `filter`     | `filter`        | none           |
| `blur`       | `--blur`        | `blurs`        |
| `brightness` | `--brightness`  | none           |
| `contrast`   | `--contrast`    | none           |
| `grayscale`  | `--grayscale`   | none           |
| `hueRotate`  | `--hue-rotate`  | none           |
| `invert`     | `--invert`      | none           |
| `saturate`   | `--saturate`    | none           |
| `sepia`      | `--sepia`       | none           |
| `dropShadow` | `--drop-shadow` | `dropShadows`  |

## Backdrop Filter

Apply filters to the backdrop of an element.

```jsx
<div className={css({ backdropFilter: 'auto', backdropBlur: 'sm' })} />
```

| Prop                 | CSS Property            | Token Category |
| -------------------- | ----------------------- | -------------- |
| `backdropFilter`     | `backdrop-filter`       | none           |
| `backdropBlur`       | `--backdrop-blur`       | `blurs`        |
| `backdropBrightness` | `--backdrop-brightness` | none           |
| `backdropContrast`   | `--backdrop-contrast`   | none           |
| `backdropGrayscale`  | `--backdrop-grayscale`  | none           |
| `backdropHueRotate`  | `--backdrop-hue-rotate` | none           |
| `backdropInvert`     | `--backdrop-invert`     | none           |
| `backdropOpacity`    | `--backdrop-opacity`    | none           |
| `backdropSaturate`   | `--backdrop-saturate`   | none           |
| `backdropSepia`      | `--backdrop-sepia`      | none           |
