---
'@pandacss/generator': patch
---

- Add reset styles for `::selection` pseudo element that maps to `var(--global-color-selection, revert)`.
- Add support for `unstyled` prop in the `styled` factory. This makes it possible to opt out recipe styles as needed.

```tsx
const Notice = styled('div', {
  base: {
    bg: 'red',
    color: 'white',
  },
})

// This will remove the recipe styles and only apply the inline styles
<Notice unstyled bg="pink" color="green">
  Hello
</Notice>
```
