---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
---

Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
`!important`

```ts
css({
  borderWidth: '[2px!]',
  width: '[2px !important]',
})
```
