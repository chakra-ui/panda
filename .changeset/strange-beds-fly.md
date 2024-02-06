---
'@pandacss/parser': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Allow configuring the `matchTag` / `matchTagProp` functions to customize the way Panda extracts your JSX. This can be
especially useful when working with libraries that have properties that look like CSS properties but are not and should
be ignored.

> **Note**: This feature mostly affects users who have `jsxStyleProps` set to `all`. This is currently the default.
>
> Setting it to `minimal` (which also allows passing the css prop) or `none` (which disables the extraction of CSS
> properties) will make this feature less useful.

Here's an example with Radix UI where the `Select.Content` component has a `position` property that should be ignored:

```tsx
// Here, the `position` property will be extracted because `position` is a valid CSS property
<Select.Content position="popper" sideOffset={5}>
```

```tsx
export default defineConfig({
  // ...
  hooks: {
    'parser:before': ({ configure }) => {
      configure({
        // ignore the Select.Content entirely
        matchTag: (tag) => tag !== 'Select.Content',
        // ...or specifically ignore the `position` property
        matchTagProp: (tag, prop) => tag === 'Select.Content' && prop !== 'position',
      })
    },
  },
})
```
