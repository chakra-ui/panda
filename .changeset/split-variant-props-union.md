---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `splitVariantProps` collapsing union props.

```ts
type Props = { role: 'guest'; expiration: number } | { role: 'admin'; permissions: string[] }
const [, rest] = button.splitVariantProps(props as Props) // rest stays a union
```
