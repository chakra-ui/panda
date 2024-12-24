---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Improve inference of slots in slot recipes when spreading and concatenating slot names.

This handles the following case gracefully:

```ts
const styles = sva({
  className: 'foo',
  slots: [...componentAnatomy.keys(), 'additional', 'slots', 'here'],
})
```

Panda will now infer the slots from the anatomy and add them to the recipe.
