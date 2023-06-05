---
title: Display
description: Panda provides style properties for styling display of an element
---

# Display

Panda provides the following utilities or style properties for styling display of an element.

## Display Property

```jsx
<div className={css({ display: 'flex' })} />
```

## Hiding Elements

Panda provides shortcut properties for hiding elements from and below a specific breakpoint.

### Hide From

```jsx
<div className={css({ display: 'flex', hideFrom: 'md' })} />
```

### Hide Below

```jsx
<div className={css({ display: 'flex', hideBelow: 'md' })} />
```

| Prop        | CSS Property | Token Category |
| ----------- | ------------ | -------------- |
| `hideFrom`  | `display`    | `breakpoints`  |
| `hideBelow` | `display`    | `breakpoints`  |
