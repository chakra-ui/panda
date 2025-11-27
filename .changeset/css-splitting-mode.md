---
'@pandacss/node': minor
'@pandacss/generator': minor
'@pandacss/cli': minor
---

Add `--splitting` flag to `cssgen` command for per-layer CSS output.

When enabled, CSS is emitted as separate files instead of a single `styles.css`:

```
styled-system/
├── styles.css              # @layer declaration + @imports
└── styles/
    ├── reset.css           # Preflight/reset CSS
    ├── global.css          # Global CSS
    ├── tokens.css          # Design tokens
    ├── utilities.css       # Utility classes
    ├── recipes/
    │   ├── index.css       # @imports all recipe files
    │   └── {recipe}.css    # Individual recipe styles
    └── themes/
        └── {theme}.css     # Theme tokens (not auto-imported)
```

Usage:

```bash
panda cssgen --splitting
```
