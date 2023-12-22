---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add `patterns` to `config.staticCss`

---

Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
need (it's still possible by explicitly using `responsive: true`).

```ts
const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
    visual: {
      primary: { backgroundColor: 'blue' },
      secondary: { backgroundColor: 'gray' },
    },
  },
})

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: ['*'], // this

      // was equivalent to:
      card: [
        // notice how `responsive: true` was implicitly added
        { size: ['*'], responsive: true },
        { visual: ['*'], responsive: true },
      ],

      //   will now correctly be equivalent to:
      card: [{ size: ['*'] }, { visual: ['*'] }],
    },
  },
})
```

Here's the diff in the generated CSS:

```diff
@layer recipes {
  .card--size_small {
    font-size: 14px;
  }

  .card--size_large {
    font-size: 18px;
  }

  .card--visual_primary {
    background-color: blue;
  }

  .card--visual_secondary {
    background-color: gray;
  }

  @layer _base {
    .card {
      color: var(--colors-white);
    }
  }

-  @media screen and (min-width: 40em) {
-    -.sm\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.sm\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.sm\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.sm\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 48em) {
-    -.md\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.md\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.md\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.md\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 64em) {
-    -.lg\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.lg\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.lg\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.lg\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 80em) {
-    -.xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 96em) {
-    -.\32xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.\32xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.\32xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.\32xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }
}
```
