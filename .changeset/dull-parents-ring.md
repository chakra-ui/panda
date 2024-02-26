---
'@pandacss/core': patch
---

Fix conditions sorting issue in generated CSS when nesting pseudo selectors

```ts
css({
  '&.light': { '&::hover': { color: 'green' } },
  '&::hover': { '&.light': { color: 'yellow' } },
})
```

will generate the following CSS:

```diff
@layer utilities {
  .[&.light]:[&::hover]:text_green.light::hover {
    color: green;
  }

-  .[&::hover]:[&.light]:text_yellow::hover.light {
+  .[&::hover]:[&.light]:text_yellow.light::hover {
    color: yellow;
  }
}
```
