---
'@pandacss/config': minor
'@pandacss/types': minor
---

Allow `config.hooks` to be in `presets`, will sequentially call them

For the `cssgen:done` hook, the return result (if any) of the previous hook call is passed to the next hook (in
`args.content`)
