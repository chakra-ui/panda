---
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/node': minor
---

Allow `config.hooks` to be shared in `plugins`

For hooks that can transform Panda's internal state by returning something (like `cssgen:done` and `codegen:prepare`),
each hook instance will be called sequentially and the return result (if any) of the previous hook call is passed to the
next hook so that they can be chained together.
