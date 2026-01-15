---
'@pandacss/types': patch
'@pandacss/is-valid-prop': patch
---

Update `csstype` from 3.1.3 to 3.2.3, which adds support for newer CSS properties including:

- Anchor positioning: `anchorName`, `anchorScope`, `positionAnchor`, `positionArea`, `positionTry`,
  `positionTryFallbacks`, `positionTryOrder`, `positionVisibility`
- Text wrapping: `textWrapMode`, `textWrapStyle`, `textSpacingTrim`
- Form sizing: `fieldSizing`, `interpolateSize`

Add support for the experimental [`corner-shape`](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape) CSS
property, which specifies the shape of a box's corners. Valid values include: `round`, `square`, `bevel`, `scoop`,
`notch`, `squircle`, and `superellipse(<number>)`.
