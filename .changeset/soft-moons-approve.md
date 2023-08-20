---
'@pandacss/generator': patch
---

Add `css` prop to recipes and patterns so you don't have to import and use `cx` for that one little edge case.

Before:

```tsx
<button className={cx(button({ variant: 'primary', state: 'focused' }), css({ color: 'yellow' }))}>Click me</button>
```

Now:

```tsx
<button className={button({ variant: 'primary', state: 'focused', css: { color: 'yellow' } })}>Click me</button>
```
