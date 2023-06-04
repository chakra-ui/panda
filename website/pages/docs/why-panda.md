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

So, the question is, **is CSS-in-JS dead?** The answer is **no, but it needs to evolve.**

## The new era of CSS-in-JS

Panda is a new CSS-in-JS library that aims to solve the new challenges of CSS-in-JS in the server-first era. It provides developers with primitives to create, organize, and manage CSS styles in a type-safe and readable manner.

- **Static Analysis:** Panda uses static analysis to parse and analyze your styles at build time, and generate CSS files that can be used in any server-first framework.

- **PostCSS:** After static analysis, Panda uses a set of carefully crafted PostCSS plugins to convert the parsed data to atomic css. **This makes Panda compatible with any framework that supports PostCSS.**

- **Type-Safety:** Panda combines `csstype` and auto-generates typings to provide type-safety for css properties and design tokens.

- **Performance:** Panda is built with performance in mind. It uses a unique approach to generate atomic CSS files that are optimized for performance and readability.

- **Codegen:** Panda generates a featherweight runtime JS code that is used to author styles. **Think of the runtime as fast object key-value join function**. It doesn't generate styles in the browser nor inject styles in the `<head>`, that is managed by PostCSS.

- **Developer Experience:** Panda provides a great developer experience with a rich set of features like auto-completion, typesafety JSX style props, linting, and more.

- **Modern CSS**: Panda uses modern CSS features like cascade layer, css variables, modern css selectors `:where` and `:is` to generate styles.

## When to use Panda?

### Styling engine

If you're building a JavaScript application with a framework that supports PostCSS, Panda is a great choice for you. However, if your framework doesn't support PostCSS, you can use Panda CLI.

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

### Token generator

Panda has first-class support for design tokens. It provides a way to express raw tokens and semantic tokens for your project. You don't need to use a JavaScript to get this benefit.

Add tokens to the panda config file and generate css variables for your project. Use the generated tokens in your vanilla project or any way you like.

```ts filename="panda.config.ts"
export default defineConfig({
  emitTokensOnly: true,
  theme: {
    tokens: {
      colors: {
        gray50: '#F9FAFB',
        gray100: '#F3F4F6'
      }
    },
    semanticTokens: {
      colors: {
        primary: '{colors.gray50}',
        success: { _light: '{colors.green500}', _dark: '{colors.green200}' }
      }
    }
  }
})
```

```bash
pnpm panda codegen
```

This will generate

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

If you're building with HTML and CSS, or a template based framework like PHP, Panda isn't the right fit.

We recommend that you use vanilla CSS (which is getting awesome by the day), or other utility based CSS libraries.
