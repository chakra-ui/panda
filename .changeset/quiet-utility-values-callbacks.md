---
'@pandacss/compiler': patch
---

Fix a config load error when a `utility.values` callback returns nothing. Listing `@pandacss/preset-base` on its own
failed with `Utility values callback ... returned invalid values`, because `translateZ` reads the spacing scale and
preset-base ships no tokens. The utility now simply has no preset values, and arbitrary values still work.
