---
'@pandacss/extractor': patch
'@pandacss/parser': patch
---

Fix static extraction of the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax) when
used with runtime conditions

Given a component like this:

```ts
function App() {
  return <Box py={[2, verticallyCondensed ? 2 : 3, 4]} />
}
```

the `py` value was incorrectly extracted like this:

```ts
 {
    "py": {
        "1": 2,
    },
},
{
    "py": {
        "1": 3,
    },
},
```

which would then generate invalid CSS like:

```css
.paddingBlock\\\\:1_2 {
  1: 2px;
}

.paddingBlock\\\\:1_3 {
  1: 3px;
}
```

it's now correctly transformed back to an array:

```diff
{
  "py": {
-    "1": 2,
+   [
+       undefined,
+       2,
+   ]
  },
},
{
  "py": {
-    "1": 3,
+   [
+       undefined,
+       3,
+   ]
  },
},
```

which will generate the correct CSS

```css
@media screen and (min-width: 40em) {
  .sm\\\\:py_2 {
    padding-block: var(--spacing-2);
  }

  .sm\\\\:py_3 {
    padding-block: var(--spacing-3);
  }
}
```
