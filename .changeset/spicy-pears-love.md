---
'@pandacss/generator': patch
'@pandacss/shared': patch
---

Improve the performance of the runtime transform functions by caching their results (css, cva, sva, recipe/slot recipe,
patterns)

> See detailed breakdown of the performance improvements
> [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.
