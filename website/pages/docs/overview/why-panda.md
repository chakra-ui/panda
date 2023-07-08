---
title: Why Panda
description: Panda is a powerful styling library that provides developers with primitives to create, organize, and manage CSS styles in a type-safe and readable manner.
---

# The Motivation

From the endless list of CSS-in-JS libraries, why should you choose Panda?

## Backstory

Runtime CSS-in-JS and style props are powerful features that allow developers to build dynamic UI components that are composable, predictable, and easy to use. However, it comes at the cost of performance and runtime.

With the release of Server Components and the rise of server-first frameworks, most existing runtime CSS-in-JS styling solutions (like emotion, styled-components) either can't work reliably, or can't work anymore. This new paradigm is a huge win for performance, development, and user experience, however, it poses a new "Innovate or Die" challenge for CSS-in-JS libraries.

> **Fun Fact:** Most CSS-in-JS libraries have a pinned issue on their GitHub repo about "Next app dir" or/and "Server Components" 😅, making the challenge even more obvious.

So, the question is, **is CSS-in-JS dead?** The answer is **no, but it needs to evolve!**

## The new era of CSS-in-JS

Panda is a new CSS-in-JS engine that aims to solve the challenges of CSS-in-JS in the server-first era. It provides styling primitives to create, organize, and manage CSS styles in a type-safe and readable manner.

- **Static Analysis:** Panda uses static analysis to parse and analyze your styles at build time, and generate CSS files that can be used in any JavaScript framework.

- **PostCSS:** After static analysis, Panda uses a set of PostCSS plugins to convert the parsed data to atomic css at build time. **This makes Panda compatible with any framework that supports PostCSS.**

- **Codegen:** Panda generates a lightweight runtime JS code that is used to author styles. **Think of it as an optimized function that joins key-value pairs of an object**. It doesn't generate styles in the browser nor inject styles in the `<head>`.

- **Type-Safety:** Panda combines `csstype` and auto-generated typings to provide type-safety for css properties and design tokens.

- **Performance:** Panda uses a unique approach to generate atomic CSS files that are optimized for performance and readability.

- **Developer Experience:** Panda provides a great developer experience with a rich set of features like recipes, patterns, design tokens, JSX style props, and more.

- **Modern CSS**: Panda uses modern CSS features like cascade layers, css variables, modern selectors like `:where` and `:is` in generated styles.

## When to use Panda?

### Styling engine

If you're building a JavaScript application with a framework that supports PostCSS, Panda is a great choice for you.

```jsx
import { css } from '../styled-system/css'
import { circle, stack } from '../styled-system/patterns'

function App() {
  return (
    <div
      className={stack({
        direction: 'row',
        p: '4',
        rounded: 'md',
        shadow: 'lg',
        bg: 'white'
      })}
    >
      <div className={circle({ size: '5rem', overflow: 'hidden' })}>
        <img src="https://via.placeholder.com/150" alt="avatar" />
      </div>
      <div className={css({ mt: '4', fontSize: 'xl', fontWeight: 'semibold' })}>
        John Doe
      </div>
      <div className={css({ mt: '2', fontSize: 'sm', color: 'gray.600' })}>
        john@doe.com
      </div>
    </div>
  )
}
```

> If your framework doesn't support PostCSS, you can use the [Panda CLI](/docs/installation/cli)

### Token generator

Panda has first-class support for design tokens. It provides a way to express raw and semantic tokens for your project. The generator can be used to create a set of CSS variables for your design tokens.

```ts filename="panda.config.ts"
export default defineConfig({
  emitTokensOnly: true,
  theme: {
    tokens: {
      colors: {
        gray50: { value: '#F9FAFB' },
        gray100: { value: '#F3F4F6' }
      }
    },
    semanticTokens: {
      colors: {
        primary: { value: '{colors.gray50}' },
        success: {
          value: { _light: '{colors.green500}', _dark: '{colors.green200}' }
        }
      }
    }
  }
})
```

Running the `panda codegen` will generate

```css filename="styled-system/tokens/index.css"
:root {
  --colors-gray50: #f9fafb;
  --colors-gray100: #f3f4f6;
  --colors-primary: var(--colors-gray50);
  --colors-success: var(--colors-green500);
}

[data-theme='dark'] {
  --colors-primary: var(--colors-gray50);
  --colors-success: var(--colors-green200);
}
```

Then you have a set of css variables that you can use in your project.

```css
@import '../styled-system/tokens/index.css';

.card {
  background-color: var(--colors-gray50);
}
```

## When not to use Panda?

Panda isn't the right fit for your project if:

- You're building with HTML and CSS.
- You're using a template-based framework like PHP.
- You're looking for an absolute zero JS solution.

In these scenarios, we recommend that you use vanilla CSS (which is getting awesome by the day), or other utility based CSS libraries.
