---
'@pandacss/parser': patch
'@pandacss/types': patch
---

Add `matchTagMode` to let parser hooks fully override JSX tag matching.

```ts
hooks: {
  'parser:before': ({ configure }) => {
    configure({
      matchTagMode: 'override',
      matchTag(tag, isPandaComponent) {
        return isPandaComponent && tag !== 'Stack'
      },
    })
  },
}
```
