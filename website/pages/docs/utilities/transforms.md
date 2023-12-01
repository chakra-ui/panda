---
title: Transforms
description: Panda provides utilities for transforming elements.
---

# Transforms

Panda provides utilities for transforming elements.

## Scale

Control the scale property. Supported value is `auto`

```jsx
<div className={css({ scale: 'auto' })} /> // => 'var(--scale-x) var(--scale-y)'
```

### Scale X

Control the scaleX property.

```jsx
<div className={css({ scaleX: '1.3' })} /> // => --scale-x: 1.3;
```

### Scale Y

Control the scaleY property.

```jsx
<div className={css({ scaleY: '0.4' })} /> // => --scale-y: 0.4;
```

## Translate

Control the translate property. Supported value is `auto`

```jsx
<div className={css({ translate: 'auto' })} /> // => 'var(--translate-x) var(--translate-y)'
```

### Translate X

Control the translateX property.

```jsx
<div className={css({ translateX: '50%' })} /> // => --translate-x: 50%;
<div className={css({ x: '20px' })} /> // shorthand
```

### Translate Y

Control the translateY property.

```jsx
<div className={css({ translateY: '-40%' })} /> // => --translate-y: -40%;
<div className={css({ y: '4rem' })} /> // shorthand
```
