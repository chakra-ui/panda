---
'@pandacss/eslint-plugin': patch
---

Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first Panda lint
rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, a consolidated
`no-deprecated` covering deprecated tokens, utilities, recipes, and patterns — with the author's deprecation message and
a `kinds` option, and `prefer-token`, which flags raw values where a token exists and tells you the token to use
(semantic tokens preferred, value forms normalized) across every style-writing form — `css()`, style props, responsive
arrays, per-prop conditions, and `cva`/`sva`/`styled` recipe styles — with a per-leaf quick-fix; `recommended` scopes it
to colors, replacing v1's `no-hardcoded-color`; plus `no-shorthand-longhand-mix`, which flags a shorthand mixed with one
of its own longhands in the same block (`margin` + `marginLeft`) since the longhand wins regardless of source order;
and `consistent-property-style`, an autofixable rule enforcing either Panda shorthand aliases (`ml`) or longhand
canonical names (`marginLeft`) via `style: 'shorthand' | 'longhand'`; and `no-invalid-nesting` (recommended), which
flags a nested selector missing `&` — e.g. `':hover'` instead of `'&:hover'` — that Panda silently ignores, and
suggests the `&` prefix), and a `configs.recommended({ configPath })`
flat-config entry with
`@pandacss/*` rule ids. Config
and compiler loading is preloaded once per project so rule visitors stay synchronous.

The same rules also run under oxlint via the `@pandacss/eslint-plugin/oxlint` entry (oxlint's ESLint-compatible JS
plugins).
