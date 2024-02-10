---
'@pandacss/generator': minor
'@pandacss/config': minor
'@pandacss/parser': minor
'@pandacss/shared': minor
'@pandacss/core': minor
'@pandacss/node': minor
---

- Sort the longhand/shorthand atomic rules in a deterministic order to prevent property conflicts
- Automatically merge the `base` object in the `css` root styles in the runtime
- This may be a breaking change depending on how your styles are created

Ex:

```ts
css({
  padding: '1px',
  paddingTop: '3px',
  paddingBottom: '4px',
})
```

Will now always generate the following css:

```css
@layer utilities {
  .p_1px {
    padding: 1px;
  }

  .pt_3px {
    padding-top: 3px;
  }

  .pb_4px {
    padding-bottom: 4px;
  }
}
```
