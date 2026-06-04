---
'@pandacss/preset-atlaskit': minor
---

Update `@atlaskit/tokens` to v13 and regenerate the preset. The generated theme had been stuck on ~v7-era values, so this brings it in line with the current Atlassian Design System.

### What changed

- Core colors refreshed (e.g. yellow palette, and the chart palette is restructured from `chart.1`–`chart.3` to `chart.5`–`chart.7` plus `danger`/`warning`/`success`/`discovery` accents).
- Elevation/shadow colors moved to the new neutral base (`rgba(9, 30, 66, …)` → `rgba(30, 31, 33, …)`).
- Several dark-mode semantic colors retuned.
- Added `radii.xxlarge` (16px).
- Removed the deprecated `UNSAFE_small` text style and its `fontSizes` / `lineHeights` tokens.

### Migration

- No code changes are needed for most users; expect visual updates to colors and shadows.
- If you reference `UNSAFE_small` (in `textStyles`, `fontSizes`, or `lineHeights`), switch to the supported `small` scale.
- If you reference the old `chart.1`–`chart.3` tokens, remap to `chart.5`–`chart.7` or the named accent tokens.
