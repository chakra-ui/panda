---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/types': minor
---

Add support for cursor token types. Useful for tokenizing cursor types for interactive components.

Here's an example of how to define a cursor token in your `panda.config.ts` file:

```ts
// panda.config.ts
export default defineConfig({
  theme: {
    extend: {
      tokens: {
        cursor: {
          button: { value: 'pointer' },
          checkbox: { value: 'default' },
        },
      },
    },
  },
})
```

Then you can use the cursor token in your styles or recipes.

```tsx
<button className={css({ cursor: 'button' })}>Click me</button>
```

This makes it easy to manage cursor styles across your application.
