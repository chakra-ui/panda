---
'@pandacss/compiler': patch
---

Speed up `staticCss` builds that use breakpoint or container conditions. Condition queries are resolved once per theme
instead of rebuilt for every rule, so a config on `preset-panda`'s container scale drops from ~14s to ~0.3s (roughly
50x faster, a 98% cut) with identical CSS output. The saving grows with the scale: a 64-size container scale goes from
52.6s to 38ms.
