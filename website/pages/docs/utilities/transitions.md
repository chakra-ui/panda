---
title: Transitions
description: Panda provides utilities for defining and customizing transitions.
---

# Transitions

Panda provides utilities for defining and customizing transitions.

## Transition

A shorthand utility for defining common transition sets.

Values are `all`, common`, `colors`, `opacity`, `shadow`, `transform`.

```jsx
<div className={css({ transition: 'all' })} />
<div className={css({ transitionTimingFunction: 'linear' })} />
<div className={css({ transitionDelay: 'fast' })} />
<div className={css({ transitionDuration: 'faster' })} />
```

| Prop                       | CSS Property                 | Token Category |
| -------------------------- | ---------------------------- | -------------- |
| `transitionTimingFunction` | `transition-timing-function	` | `easings`      |
| `transitionDelay`          | `transition-delay	`           | `durations`    |
| `transitionDuration`       | `transition-duration	`        | `durations`    |

## Animation

Control the animation property. It supports the `animations` token category.

```jsx
<div className={css({ animation: 'bounce' })} />
<div className={css({ animationName: 'pulse' })} />
<div className={css({ animationDelay: 'fast' })} />
```

| Prop             | CSS Property      | Token Category |
| ---------------- | ----------------- | -------------- |
| `animation`      | `animation-name	`  | animations     |
| `animationName`  | `animation-name	`  | animationName  |
| `animationDelay` | `animation-delay	` | durations      |
