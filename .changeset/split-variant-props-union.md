---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `splitVariantProps` collapsing union props. The rest props keep each member of the union, as in v1.

```ts
type Props = { role: 'guest'; expiration: number } | { role: 'admin'; permissions: string[] }
const [, rest] = button.splitVariantProps(props as Props) // rest is still the union
```
