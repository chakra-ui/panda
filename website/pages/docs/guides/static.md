---
title: Static CSS Generator
description: Panda can be used to generate a static set of utility classes for your project.
---

# Static CSS Generator

Panda can be used to generate a static set of utility classes for your project.

This is useful if you want to use Panda in an HTML project or you want absolute zero runtime.

## Usage

To generate a static set of CSS classes, add them to your `panda.config.js` file:

```js
export default {
  staticCss: {
    // the css properties you want to generate
    css: [],
    // the recipes you want to generate
    recipes: {}
  }
}
```

The `static` property supports two properties:

- `css` - an array of CSS properties you want to generate with their `conditions`
- `recipes` - the component recipes you want to generate

## Generating CSS Properties

The `css` property is an array of CSS properties you want to generate with their `conditions`.

You can specify the following options:

- `properties`: the CSS properties you want to generate
- `conditions`: the CSS conditions or selectors you want to generate in addition to the default values. Values can be
  `light, dark`, etc.
- `responsive`: whether or not to generate responsive classes
- `values`: the values you want to generate for the CSS property. When set to `*`, all values defined in the tokens will
  be included. When set to an array, only the values in the array will be generated.

```js
export default {
  staticCss: {
    css: [
      {
        properties: {
          margin: ['*'],
          padding: ['*', '50px', '80px']
        },
        responsive: true
      },
      {
        properties: {
          color: ['*'],
          backgroundColor: ['green.200', 'red.400']
        },
        conditions: ['light', 'dark']
      }
    ]
  }
}
```

## Generating Recipes

The `recipes` property is an object of component recipes you want to generate with their `conditions`.

```js
export default {
  staticCss: {
    recipes: {
      button: [
        {
          size: ['sm', 'md'],
          responsive: true
        },
        { variant: ['*'] }
      ],
      // shorthand for all variants
      tooltip: ['*']
    }
  }
}
```

You can also directly specify a recipe's `staticCss` rules from inside a recipe config, e.g.:

```js
import { defineRecipe } from '@pandacss/dev'

const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' }
    }
  },
  staticCss: [{ size: ['*'] }]
})
```

would be the equivalent of defining it inside the main config:

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: {
        size: ['*']
      }
    }
  }
})
```

## Removing unused CSS

For an even smaller css output size, you can utilize [PurgeCSS](https://purgecss.com/) to treeshake and remove unused
CSS. This tool will analyze your template and match selectors against your CSS.
