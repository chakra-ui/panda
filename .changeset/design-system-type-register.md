---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Apps that consume a design system now share its style types. Styles, tokens and keyframes the app adds are accepted
wherever the design system's types are used, including in stacked design systems.

```ts
const styles: SystemStyleObject = css.raw({ animationName: 'appFade' }) // SystemStyleObject from '@acme/ui/types'
```
