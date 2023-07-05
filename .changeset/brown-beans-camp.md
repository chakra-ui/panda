---
'@pandacss/generator': patch
---

Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

```
styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                            ~

  styled-system/types/global.d.ts:14:33
    14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                       ~
    This type parameter might need an `extends PatternProperties` constraint.

```
