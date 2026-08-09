---
'@pandacss/compiler': patch
---

Fix `.raw()` on an imported recipe being left alone in files that import nothing else from Panda.

```ts
import { button } from './recipes' // the only import

const styles = button.raw() // was a class string, now { color: 'red' }
```
