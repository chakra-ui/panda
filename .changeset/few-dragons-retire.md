---
'@pandacss/generator': patch
'@pandacss/studio': patch
---

Fix nested `styled` factory composition

```tsx
import { styled } from '../styled-system/jsx'

const BasicBox = styled('div', { base: { fontSize: '10px' } })
const ExtendedBox1 = styled(BasicBox, { base: { fontSize: '20px' } })
const ExtendedBox2 = styled(ExtendedBox1, { base: { fontSize: '30px' } })

export const App = () => {
  return (
    <>
      {/* ✅ fs_10px */}
      <BasicBox>text1</BasicBox>
      {/* ✅ fs_20px */}
      <ExtendedBox1>text2</ExtendedBox1>
      {/* BEFORE: ❌ fs_10px fs_30px */}
      {/* NOW: ✅ fs_30px */}
      <ExtendedBox2>text3</ExtendedBox2>
    </>
  )
}
```
