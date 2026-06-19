---
'@pandacss/compiler': patch
---

Fix a structural pseudo being relocated off the parent onto a nested descendant in chained arbitrary `&` selectors.

Two nested arbitrary-selector object keys form a parent→descendant chain, e.g. `css({ '&:last-child': { '& .divider': { display: 'none' } } })`. v1 (and the intended cascade) emits `.cls:last-child .divider` — the structural pseudo stays on the class-bearing parent. v2 emitted `.cls .divider:last-child`, relocating `:last-child` onto the descendant — a different selector that matches the wrong elements.

The cause is the condition sort: it orders selector conditions by pseudo-class priority, which floats the relational `& .divider` (priority 0) ahead of the pseudo `&:last-child` (priority > 0), inverting the authored nesting. For *named* conditions (`_hover`, `_dark`, …) that ordering is correct and order-independent, but for **raw arbitrary `&` selectors authored as nested object keys** the order is structurally significant.

The sort now preserves author order whenever either side is a raw nested-selector key that establishes a combinator relationship (descendant ` `, child `>`, sibling `+`/`~`). Named/breakpoint/container/theme conditions keep their existing cascade sort, and bare compounds like `&:last-child` still sort normally. The rule grouping/dedup key (`CssRuleKey`) is unaffected — only the apply order of nested arbitrary selectors changes.
