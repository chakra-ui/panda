---
'@pandacss/compiler': patch
---

Apply custom utility `transform` functions everywhere styles are authored.

Custom-utility transforms (and their shorthands) now run inside `cva`/`sva`, `styled` recipes, `globalCss`, and
composition styles (`textStyles`/`layerStyles`/`animationStyles`) — including conditional values — matching `css()` and
config recipes. This fixes preset-base's `shadowColor`/`textShadowColor` and any user utility that maps a value to a
custom property.
