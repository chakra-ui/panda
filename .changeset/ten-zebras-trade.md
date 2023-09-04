---
'@pandacss/core': patch
---

Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token were left
unchanged (due to the `.`)

Before:

```css
* {
  color: token(colors.magenta, pink);
}
```

Now:

```css
* {
  color: token('colors.magenta', pink);
}
```
