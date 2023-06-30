---
'@pandacss/extractor': patch
---

Fix `ShorthandPropertyAssignment` handling on root objects, it was only handled when accessing an object from a prop
acces / element access

this was fine:

```ts
const aliased = 'green.600'
const colorMap = { aliased }
const className = css({ color: colorMap['aliased'] })
```

this was not (weirdly):

```ts
const color = 'green.600'
const className = css({ color })
```
