---
'@pandacss/core': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

- Boost style extraction performance by moving more work away from postcss
- Using a hashing strategy, the compiler only computes styles/classname once per style object and prop-value-condition
  pair
- Fix regression in previous implementation that increased memory usage per extraction, leading to slower performance
  over time
