---
'@pandacss/shared': minor
'@pandacss/core': minor
---

Add support native css nesting in template literal mode. Prior to this change, you need to add `&` to all nested
selectors.

Before:

```ts
css`
  & p {
    color: red;
  }
`
```

After:

```ts
css`
  p {
    color: red;
  }
`
```

> **Good to know**: Internally, this will still convert to `p` to `& p`, but the generated css will work as expected.
