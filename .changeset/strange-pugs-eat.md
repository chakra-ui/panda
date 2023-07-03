---
'@pandacss/core': patch
---

Refactor the way recipes are found: Always use recipe.name instead of sometimes relying on the key used in the
`theme.recipes` object

Which means, this didn't work before and now it does:

```ts panda.config.ts
// ...
theme: {
    recipes: {
        buttonRecipeWithKeyNotMatchingName: {
        name: 'button',
        description: 'The styles for the Button component',
        base: {
            display: 'flex',
            bg: 'red.200',
            color: 'white',
        },
        },
    },
},
```

```ts App.tsx
import { button } from '.panda/recipes'

// ...
const App = () => <div className={button()} />
```
