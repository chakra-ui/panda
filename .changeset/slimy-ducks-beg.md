---
'@pandacss/core': patch
---

Automatically add each recipe slots to the `jsx` property, with a dot notation

```ts
const button = defineSlotRecipe({
  className: 'button',
  slots: ['root', 'icon', 'label'],
  // ...
})
```

will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`
