---
title: Cascade Layers
description: CSS cascade layers refer to the order in which CSS rules are applied to an HTML element.
---

# Cascade Layers

CSS cascade layers refer to the order in which CSS rules are applied to an HTML element. When multiple CSS rules apply
to the same element, the browser uses the cascade to determine which rule should take precedence. See the
[MDN article](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) to learn more.

Panda take advantage of the cascade to provide a more efficient and flexible way to organize styles. This allows you to
define styles in a modular way, using CSS rules that are scoped to specific components or elements.

## Layer Types

Panda supports five types of cascade layers out of the box:

- `@layer reset` - The reset layer is used to reset the default styles of HTML elements. This is used when
  `preflight: true` is set in the config. You can also use this layer to add your own reset styles.

The generated CSS for the reset layer looks like this:

```css
@layer reset {
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  /* ... */
}
```

- `@layer base` - The base layer contains global styles defined in the `globalStyles` key in the config. You can also
  use this layer to add your own global styles.

The generated CSS for the base layer looks like this:

```css
@layer base {
  a {
    color: #000;
    text-decoration: none;
  }
  /* ... */
}
```

- `@layer recipes` - The recipes layer contains styles for recipes created within the config (aka config recipes). You
  can also use this layer to add your own component styles.

The generated CSS for the recipes layer looks like this:

```css
@layer recipes {
  .button {
    /* ... */
  }

  .button--variant-primary {
    /* ... */
  }
  /* ... */
}
```

- `@layer tokens` - The tokens layer contains css variables for tokens and semantic tokens. You can also use this layer
  to add your own design tokens.

The generated CSS for the tokens layer looks like this:

```css
@layer tokens {
  :root {
    --color-primary: #000;
    --color-secondary: #fff;
    --color-tertiary: #ccc;
    --shadow-sm: 0 0 0 1px rgba(0, 0, 0, 0.05);
  }
  /* ... */
}
```

- `@layer utilities` - Styles that are scoped to a specific utility class. These styles are only applied to elements
  that have the utility class applied.

## Layer Order

The cascade layers are applied in the following order:

- `@layer utilities` (Highest priority)
- `@layer recipes`
- `@layer tokens`
- `@layer base`
- `@layer reset` (Lowest priority)

This means that styles defined in the `@layer utilities` will take precedence over styles defined in the
`@layer recipes`. This is useful when you want to override the default styles of a component.

## Layer CSS

The generated CSS in Panda is organized into layers. This allows you to define styles in a modular way, using CSS rules
that are scoped to specific components or elements.

Here's what the first line of the generated CSS looks like:

```css
@layer reset, base, tokens, recipes, utilities;
```

Adding this line to the top of your CSS file will determine the order in which the layers are applied. This is the most
exciting feature of CSS cascade layers.
