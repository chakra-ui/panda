---
'@pandacss/parser': patch
---

Fix a parser issue where we didn't handle import aliases when using a {xxx}.raw() function.

ex:

```ts
// button.stories.ts
import { button as buttonRecipe } from '@ui/styled-system/recipes'

export const Primary: Story = {
  // ❌ this wouldn't be parsed as a recipe because of the alias + .raw()
  //  -> ✅ it's now fixed
  args: buttonRecipe.raw({
    color: 'primary',
  }),
}
```
