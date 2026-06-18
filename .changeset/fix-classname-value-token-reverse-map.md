---
'@pandacss/compiler': patch
---

Fix cssgen naming a class by a token alias the runtime never emits, so the rule silently never matched.

When a utility's `values` is an object map (e.g. preset-base `width`/`minHeight`, whose maps include `screen: '100vw'` / `screen: '100vh'`), the native engine reverse-mapped an authored *resolved value* back to its alias when naming the class: `css({ minHeight: '100vh' })` placed `min-h_100vh` on the element (the runtime hashes `propKey + withoutSpace(value)` verbatim, with no token dictionary) but cssgen wrote only `.min-h_screen`, so `min-height` never applied. Same for `width: '100vw'`, `maxWidth: '100vw'`, and the general object-map case `marginBottom: '0.5rem'` → element `mb_0.5rem`, rule `.mb_2`.

The engine now keeps the author's value-map key on the atom and resolves it to CSS only at emit time, matching the runtime exactly (`min-h_100vh`, `w_100vw`, `mb_0.5rem`) — and matching legacy Panda, which named these by the literal too. Authoring the token *key* is unaffected (`css({ marginBottom: '2' })` → `.mb_2`), and `token()` calls keep their resolved-value class (they are evaluated before `css()`).

Note: `compiler.atoms()` now reports the author's value-map key (e.g. `'sm'`, `'full'`) instead of the pre-resolved CSS — the resolved value is recovered when declarations are written.
