---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix JSX recipe extraction when multiple recipes were used on the same component, ex:

```tsx
const ComponentWithMultipleRecipes = ({ variant }) => {
  return (
    <button className={cx(pinkRecipe({ variant }), greenRecipe({ variant }), blueRecipe({ variant }))}>Hello</button>
  )
}
```

Given a `panda.config.ts` with recipes each including a common `jsx` tag name, such as:

```ts
recipes: {
    pinkRecipe: {
        name: 'pinkRecipe',
        jsx: ['ComponentWithMultipleRecipes'],
        base: { color: 'pink.100' },
        variants: {
            variant: {
            small: { fontSize: 'sm' },
            },
        },
    },
    greenRecipe: {
        name: 'greenRecipe',
        jsx: ['ComponentWithMultipleRecipes'],
        base: { color: 'green.100' },
        variants: {
            variant: {
            small: { fontSize: 'sm' },
            },
        },
    },
    blueRecipe: {
        name: 'blueRecipe',
        jsx: ['ComponentWithMultipleRecipes'],
        base: { color: 'blue.100' },
        variants: {
            variant: {
            small: { fontSize: 'sm' },
            },
        },
    },
},
```

Only the first matching recipe would be noticed and have its CSS generated, now this will properly generate the CSS for
each of them
