---
"@pandacss/core": patch
---

Fix pseudo-element conditions (::before, ::after) being placed before pseudo-class selectors in generated CSS

When a pseudo-element condition like `_before` was combined with a mixed condition like `_hover` (defined as an array with a media query + selector), the pseudo-element would incorrectly appear before the pseudo-class in the generated CSS selector.

**Before (broken):** `.class::before:is(:hover, ...)` - invalid CSS
**After (fixed):** `.class:is(:hover, ...)::before` - valid CSS

The fix ensures pseudo-element selectors are always sorted last in the condition chain, matching the CSS specification requirement that pseudo-elements must appear at the end of a selector.
