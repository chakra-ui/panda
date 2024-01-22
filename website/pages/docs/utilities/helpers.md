---
title: Helpers
description: Panda CSS offers utility classes to enhance accessibility and aid in debugging.
---

# Helpers

Panda CSS offers utility classes to enhance accessibility and aid in debugging.

## Screen Reader-Only Content

The srOnly utility class hides content visually while keeping it accessible to screen readers. It is particularly useful when you want to provide information to screen readers without displaying it on the screen.

```jsx
<div className={css({ srOnly: true })}>Accessible only to screen readers</div>
```

## Debug

The debug utility class applies styles to aid in debugging by adding outlines to elements. This can be helpful during development to visually inspect the layout and structure of your components.

```jsx
<div className={css({ debug: true })}>Debugging outline applied</div>
```
