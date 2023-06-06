---
title: Sizing
description: Style properties for controlling the size of an element.
---

# Sizing

Style properties for controlling the size of an element.

## Width

Use the `width` or `w` property to set the width of an element.

```jsx
<div className={css({ width: '5' })} />
<div className={css({ w: '5' })} /> // shorthand
```

### Fractional width

Use can set fractional widths using the `width` or `w` property.

Values can be within the following ranges:

- Thirds: `1/3` to `2/3`
- Fourths: `1/4` to `3/4`
- Fifths: `1/5` to `4/5`
- Sixths: `1/6` to `5/6`
- Twelfths: `1/12` to `11/12`

```jsx
<div className={css({ width: '1/2' })} />
<div className={css({ w: '1/2' })} /> // shorthand

<div className={css({ width: '1/3' })} />
<div className={css({ w: '1/3' })} /> // shorthand
```

### Max width

Use the `maxWidth` or `maxW` property to set the maximum width of an element.

```jsx
<div className={css({ maxWidth: '5' })} />
<div className={css({ maxW: '5' })} /> // shorthand
```

### Min width

Use the `minWidth` or `minW` property to set the minimum width of an element.

```jsx
<div className={css({ minWidth: '5' })} />
<div className={css({ minW: '5' })} /> // shorthand
```

| Prop               | CSS Property | Token Category |
| ------------------ | ------------ | -------------- |
| `w`, `width`       | `width`      | `sizing`       |
| `maxW`, `maxWidth` | `max-width`  | `sizing`       |
| `minW`, `minWidth` | `min-width`  | `sizing`       |

## Height

Use the `height` or `h` property to set the height of an element.

```jsx
<div className={css({ height: '5' })} />
<div className={css({ h: '5' })} /> // shorthand
```

### Fractional height

Use can set fractional heights using the `height` or `h` property.

Values can be within the following ranges:

- Thirds: `1/3` to `2/3`
- Fourths: `1/4` to `3/4`
- Fifths: `1/5` to `4/5`
- Sixths: `1/6` to `5/6`

```jsx
<div className={css({ height: '1/2' })} />
<div className={css({ h: '1/2' })} /> // shorthand
```

### Relative heights

You can use the modern relative height values `dvh`, `svh`, `lvh`.

```jsx
<div className={css({ height: 'dvh' })} />
<div className={css({ h: 'dvh' })} /> // shorthand
```

### Max height

Use the `maxHeight` or `maxH` property to set the maximum height of an element.

```jsx
<div className={css({ maxHeight: '5' })} />
<div className={css({ maxH: '5' })} /> // shorthand
```

### Min height

Use the `minHeight` or `minH` property to set the minimum height of an element.

```jsx
<div className={css({ minHeight: '5' })} />
<div className={css({ minH: '5' })} /> // shorthand
```

| Prop                | CSS Property | Token Category |
| ------------------- | ------------ | -------------- |
| `h`, `height`       | `height`     | `sizing`       |
| `maxH`, `maxHeight` | `max-height` | `sizing`       |
| `minH`, `minHeight` | `min-height` | `sizing`       |
