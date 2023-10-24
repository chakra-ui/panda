---
'@pandacss/extractor': patch
---

Extract identifier values coming from an `EnumDeclaration` member

Example:

```ts
enum Color {
  Red = 'red.400',
  Blue = 'blue.400',
}

const className = css({ color: Color.Red, backgroundColor: Color['Blue'] })
```
