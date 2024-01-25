---
'@pandacss/generator': minor
'@pandacss/parser': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

Allow specifying a custom `@layer` in a recipe config

This gives the ability to control the recipes specifity order using
[the CSS native `@layer` at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), making it easier to deal
with conflicting styles when multiple recipes are affecting the same DOM element.

```ts
export default defaultConfig({
  theme: {
    extend: {
      recipes: {
        pink: {
          // default
          className: 'pink',
          base: { color: 'pink.100' },
          staticCss: [{ variant: ['small'] }],
          variants: { variant: { small: { fontSize: 'sm' } } },
        },
        blue: {
          // custom layer
          className: 'blue',
          base: { color: 'blue.100' },
          layer: 'recipes.aaa',
          staticCss: [{ variant: ['small'] }],
          variants: { variant: { small: { fontSize: 'sm' } } },
        },
        yellow: {
          // custom layer
          className: 'yellow',
          base: { color: 'yellow.100' },
          layer: 'recipes.bbb',
          staticCss: [{ variant: ['small'] }],
          variants: { variant: { small: { fontSize: 'sm' } } },
        },
      },
    },
  },
})
```

will output a CSS like:

```css
@layer recipes {
  @layer _base {
    .pink {
      color: var(--colors-pink-100);
    }
  }

  .pink--variant_small {
    font-size: var(--font-sizes-sm);
  }
}

@layer recipes.aaa {
  .blue--variant_small {
    font-size: var(--font-sizes-sm);
  }
}

@layer recipes.aaa.base {
  .blue {
    color: var(--colors-blue-100);
  }
}

@layer recipes.bbb {
  .yellow--variant_small {
    font-size: var(--font-sizes-sm);
  }
}

@layer recipes.bbb.base {
  .yellow {
    color: var(--colors-yellow-100);
  }
}
```

you can define any order like:

```css
@layer reset, base, tokens, recipes, utilities;
@layer recipes.bbb, recipes.aaa;
```

This order means that:

- if a competing rule was found in `recipes` and `utilities`, the `utilities` will win.
- if a competing rule was found in `recipes.aaa` and `recipes.bbb`, the `recipes.aaa` will win.
