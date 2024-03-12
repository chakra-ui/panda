---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix extraction of JSX `styled` factory when using namespace imports

```tsx
import * as pandaJsx from '../styled-system/jsx'

// ✅ this will work now
pandaJsx.styled('div', { base: { color: 'red' } })
const App = () => <pandaJsx.styled.span color="blue">Hello</pandaJsx.styled.span>
```
