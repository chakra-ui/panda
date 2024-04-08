---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

Add support for deprecating tokens, utilities, patterns and config recipes.

Set the `deprecated` property to `true` to enable deprecation warnings. Alternatively, you can also set it to a string
to provide a custom migration message.

**Deprecating a utility**

```js
defineConfig({
  utilities: {
    ta: {
      deprecated: true,
      transform(value) {
        return { textAlign: value }
      },
    },
  },
})
```

**Deprecating a token**

```js
defineConfig({
  theme: {
    tokens: {
      space: {
        lg: { value: '8px', deprecated: 'use `8` instead' },
      },
    },
  },
})
```

**Deprecating a pattern**

```js
defineConfig({
  patterns: {
    customStack: {
      deprecated: true,
    },
  },
})
```

**Deprecating a recipe**

```js
defineConfig({
  theme: {
    recipes: {
      btn: {
        deprecated: 'will be removed in v2.0',
      },
    },
  },
})
```

### ESLint Plugin

These deprecation warnings will translated into the ESLint plugin as a `no-deprecated` rule.

```json
{
  "rules": {
    "no-deprecated": "warn"
  }
}
```

In the next release of the ESLint plugin, you will get a warning when using deprecated tokens or utilities.
