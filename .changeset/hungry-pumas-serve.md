---
'@pandacss/preset-base': minor
'@pandacss/generator': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

### Fixed

- Fix className collisions between utilities by using unique class names per property in the default preset.

### Changed

- **Color Mode Selectors**: Changed the default selectors for `_light` and `_dark` to target parent elements. This
  ensures consistent behavior with using these conditions to style pseudo elements (like `::before` and `::after`).

```diff
const conditions = {
-  _dark: '&.dark, .dark &',
+  _dark: '.dark &',
-  _light: '&.light, .light &',
+  _light: '.light &',
}
```

- Changed `divideX` and `divideY` now maps to the `borderWidths` token group.

### Added

- **Spacing Utilities**: Add new `spaceX` and `spaceY` utilities for applying margin between elements. Especially useful
  when applying negative margin to child elements.

```tsx
<div className={flex({ spaceX: '-1' })}>
  <div className={circle({ size: '5', bg: 'red' })} />
  <div className={circle({ size: '5', bg: 'pink' })} />
</div>
```

- Added new `_starting` condition to support the new `@starting-style` at-rule.
  [Learn more here](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
