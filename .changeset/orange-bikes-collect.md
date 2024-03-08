---
'@pandacss/extractor': patch
'@pandacss/parser': patch
'@pandacss/core': patch
---

Allow using namespaced imports

```ts
import * as p from 'styled-system/patterns'
import * as recipes from 'styled-system/recipes'
import * as panda from 'styled-system/css'

// this will now be extracted
p.stack({ mt: '40px' })

recipes.cardStyle({ rounded: true })

panda.css({ color: 'red' })
panda.cva({ base: { color: 'blue' } })
panda.sva({ base: { root: { color: 'green' } } })
```
