---
'@pandacss/dev': major
'@pandacss/types': major
---

Remove `defineParts` and the `Parts` / `Part` types. Write the part selectors directly in your recipe, or use
`defineSlotRecipe` for a class per part.

If you still want the helper, it's a few lines you can keep in your own config:

```ts
const defineParts =
  <T extends Record<string, { selector: string }>>(parts: T) =>
  (config: Partial<Record<keyof T, SystemStyleObject>>): SystemStyleObject =>
    Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value]))
```
