---
'@pandacss/generator': patch
---

Fix multi-theme issue where calling the `getTheme` function throws a Vite error due to invalid dynamic import format.

```js
import { getTheme } from 'styled-system/themes'

getTheme('default')
// -> The above dynamic import cannot be analyzed by Vite.
```
