---
"@pandacss/compiler": patch
---

Memoize generated `css()` calls that receive multiple style arguments to avoid repeated merge and serialization work, and reuse cached raw recipe/pattern resolution in generated runtimes.

In the generated runtime benchmarks, repeated multi-arg `css()` calls improved from about `1.7us` to `249ns`, the generic styled raw path improved by about `3x`, and shared pattern prop splitting dropped from roughly `2.5us` to sub-`200ns` in the final generated stack path.
