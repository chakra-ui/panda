---
'@pandacss/compiler': patch
---

Fix four v2 CSS-output regressions in `globalCss` and nested style objects:

- Bare element selectors (e.g. `'.article': { h2: { ... } }`) now nest as descendants instead of being dropped.
- Comma-separated selector groups now distribute the parent to every member (`h2, h3, h4` → `.article h2, .article h3, .article h4`).
- A composition (`textStyle`/`layerStyle`/`animationStyle`) combined with explicit properties now merges into one block, so a sibling override (e.g. `fontFamily`) wins by source order.
- Multiline values (e.g. `gridTemplateAreas` template literals) collapse their whitespace, keeping the class name and emitted declaration single-line.
