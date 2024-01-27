---
title: Template Literals
description: Panda allows you to write styles using template literals.
---

# Template Literals

Panda allows you use the [template literal syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates) as an alternative to the object literal syntax.

This provides a similar experience to [styled-components](https://styled-components.com/) and [emotion](https://emotion.sh/), except that Panda generates atomic class names instead of a single unique class name.

> Emitting atomic class names allows Panda to generate smaller CSS bundles.

Panda provides two function to write template literal styles, `css` and `styled`.

## Getting started

To use template literals, you need to set the `syntax` option in your `panda.config.ts` file to `templateLiteral`:

```ts
// panda.config.ts
export default defineConfig({
  // ...
  syntax: 'template-literal', // required
  jsxFramework: 'react' // optional
})
```

Then run the codegen command to generate the functions:

```sh
panda codegen --clean
```

## The `css` function

This the basic way of writing template styles. It converts the template literal into a set of atomic class name which you can pass to the `className` prop of an element.

```js
import { css } from '../styled-system/css'

const className = css`
  font-size: 16px;
  font-weight: bold;
`

function Heading() {
  return <h1 className={className}>This is a title</h1>
}

// => <h1 className='font-size_16px font-weight_bold'></h1>
```

Here's what the emitted atomic CSS looks like:

```css
.font-size_16px {
  font-size: 16px;
}

.font-weight_bold {
  font-weight: bold;
}
```

## The `styled` tag

The `styled` tag allows you to create a component with encapsulated styles. It's similar to the `styled-components` or `emotion` library.

```js
import { styled } from '../styled-system/jsx'

// Create a styled component
const Heading = styled.h1`
  font-size: 16px;
  font-weight: bold;
`

function Demo() {
  // Use the styled component
  return <Heading>This is a title</Heading>
}

// => <h1 class='font-size_16px font-weight_bold'>This is a title</h1>
```

Here's what the emitted atomic CSS looks like:

```css
.font-size_16px {
  font-size: 16px;
}

.font-weight_bold {
  font-weight: bold;
}
```

## Nested styles

You can nest selectors, pseudo-elements and pseudo-selectors.

```js
const Button = styled.button`
  color: black;

  &:hover {
    color: blue;
  }
`
```

Using css nesting syntax, pseudo-elements, pseudo-selectors and combinators are also supported:

```js
const Demo = styled.div`
  color: black;

  &::after {
    content: '🐼';
  }

  & + & {
    background: yellow;
  }

  &.bordered {
    border: 1px solid black;
  }

  .parent & {
    color: red;
  }
`
```

Nested media and container queries are also supported:

```js
const Demo = styled.div`
  color: black;

  @media (min-width: 200px) {
    color: blue;
  }

  @container (min-width: 200px) {
    color: red;
  }
`
```

## Hashing class names

In some cases, it might be useful to shorten the class names by hashing them. Set the `hash: true` option in your `panda.config.ts` file to enable this. This will generate shorter class names but will make it harder to debug.

To achieve this, set the `hash` option in your `panda.config.ts` file to `true`:

```ts
// panda.config.ts

export default defineConfig({
  // ...
  hash: true // optional
})
```

> Run the `codegen` command to regenerate the functions with hashing enabled.

When hashing is enabled, the class names will go from this:

```css
.font-size_16px {
  font-size: 16px;
}

.font-weight_bold {
  font-weight: bold;
}
```

To a unique six character hash regardless of the length of the selector or the number of declarations:

```css
.adfg5r {
  font-size: 16px;
}

.bsdf35 {
  font-weight: bold;
}
```

## Using tokens

Use the `token()` function or `{}` syntax in your template literals to reference design tokens in your styles. Panda will automatically generate the corresponding CSS variables.

```js
import { css } from '../styled-system/css'

const className = css`
  font-size: {fontSizes.md};
  font-weight: token(fontWeights.bold, 700);
`
```

## Caveats

The object literal syntax is the recommended way of writing styles. But, if you stick with the template literal syntax, there are some caveats to be aware of:

- Patterns are not generated
- Dynamic interpolations are not supported
- Lack of autocompletion for tokens within the template literal. 
  Our [Eslint plugin](https://github.com/chakra-ui/eslint-plugin-panda/blob/main/docs/rules/no-invalid-token-paths.md) can help you overcome this by detecting invalid tokens
