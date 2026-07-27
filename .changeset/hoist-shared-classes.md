---
'@pandacss/compiler': patch
---

Emit a class shared by every branch once instead of repeating it in each one.

```ts
// before
export const cls = (wide ? 'd_flex p_8' : 'd_flex p_4') + ' ' + (tall ? 'd_flex m_2' : 'd_flex m_1')
// after
export const cls = 'd_flex' + ' ' + (wide ? 'p_8' : 'p_4') + ' ' + (tall ? 'm_2' : 'm_1')
```
