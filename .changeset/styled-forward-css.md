---
'@pandacss/compiler': minor
---

Add a `forwardCss` option to `styled()`. When you wrap your own component, `styled(Text, config, { forwardCss: true })` passes its styles down as one `css` prop, so the outer styles override the inner ones instead of depending on stylesheet order.
