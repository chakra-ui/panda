---
'@pandacss/core': patch
---

Fix a regression with globalCss selector order

```ts
{
    globalCss: {
        html: {
          ".aaa": {
            color: "red.100",
            "& .bbb": {
              color: "red.200",
              "& .ccc": {
                color: "red.300"
              }
            }
          }
        },
    }
}
```

would incorrectly generate (regression introduced in v0.26.2)

```css
.aaa html {
  color: var(--colors-red-100);
}

.aaa html .bbb {
  color: var(--colors-red-200);
}

.aaa html .bbb .ccc {
  color: var(--colors-red-300);
}
```

will now correctly generate again:

```css
.aaa html {
  color: var(--colors-red-100);
}

.aaa html .bbb {
  color: var(--colors-red-200);
}

.aaa html .bbb .ccc {
  color: var(--colors-red-300);
}
```
