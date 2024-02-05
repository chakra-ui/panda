---
'@pandacss/config': minor
'@pandacss/types': minor
---

Allow `config.hooks` to be in `presets` and make them extendable (using the `extend` keyword as usual)

For hooks that can transform Panda's internal state by returning something (like `cssgen:done` and `codegen:prepare`),
each hook instance will be called sequentially and the return result (if any) of the previous hook call is passed to the
next hook so that they can be chained together.
