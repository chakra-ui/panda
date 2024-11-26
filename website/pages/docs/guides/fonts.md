---
title: Custom Font
description: How to use custom fonts in your project.
---

# Custom Font

Adding custom fonts to your application or website is a typical requirement for projects. Panda recommends using custom fonts through CSS variables for consistency.

## Setup

### Next.js

Next.js provides a built-in automatic self-hosting for any font file by using the `next/font` module. It allows you to conveniently use all Google Fonts and any local font with performance and privacy in mind.

Here's an example of how to load a local "Mona Sans" font and a Google Font "Fira Code" in your Next.js project.

```js filename="styles/font.ts"
import { Fira_Code } from 'next/font/google'
import localFont from 'next/font/local'

export const MonaSans = localFont({
  src: '../fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const FiraCode = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fira-code'
})
```

> Ideally, you should load the font in the layout file.

Next, you need to add the font variables to your HTML document. You can do this using either the App Router or the Pages Router.

#### App Router

```jsx filename="app/layout.tsx"
import { FiraCode, MonaSans } from '../styles/font'

export default function Layout(props) {
  const { children } = props
  return (
    <html className={`${MonaSans.variable} ${FiraCode.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

> **Note 🚨:** By default, Next.js attaches the className for the fonts to the `<body>` element, for panda to appropriately load fonts, update the code to attach the `className` to the `<html>` element.

#### Pages Router

```jsx filename="pages/_app.tsx"
import { FiraCode, MonaSans } from '../styles/font'

export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>
        {`
          :root {
            --font-mona-sans: ${MonaSans.style.fontFamily};
            --font-fira-code: ${FiraCode.style.fontFamily};
          }
        `}
      </style>
      <Component {...pageProps} />
    </>
  )
}
```

### Fontsource

[Fontsource](https://fontsource.org/) streamlines the process of integrating fonts into your web application.

To begin, install your desired font package:

```bash
pnpm add @fontsource-variable/fira-code
```

Next, import the font into your project:

```jsx
import '@fontsource-variable/fira-code'
```

Lastly, create a variable to use it as a token in the panda config

```css filename="styles/font.css"
:root {
  --font-fira-code: 'Fira Code Variable', monospace;
}
```

### Vanilla CSS

You can leverage the native font-face CSS property to load custom fonts in your project.

```css
@font-face {
  font-family: 'Mona Sans';
  src: url('../fonts/Mona-Sans.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Then alias the font names to css variables.

```css
:root {
  --font-mona-sans: 'Mona Sans', sans-serif;
}
```

### Global Font Face

You can also define global font face in your panda config.

```js
export default defineConfig({
  globalFontface: {
    Fira: {
      src: 'url(/fonts/fira.woff2) format("woff2")',
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap'
    }
  }
})
```

You can also define multiple font sources for the same weight.

```js
export default defineConfig({
  globalFontface: {
    Fira: {
      src: [
        'url(/fonts/fira.woff2) format("woff2")',
        'url(/fonts/fira.woff) format("woff")'
      ],
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap'
    }
  }
})
```

You can also define multiple font weights.

```js
export default defineConfig({
  globalFontface: {
    Fira: [
      {
        src: 'url(/fonts/fira.woff2) format("woff2")',
        fontWeight: 400,
        fontStyle: 'normal',
        fontDisplay: 'swap'
      },
      {
        src: 'url(/fonts/fira-bold.woff2) format("woff2")',
        fontWeight: 700,
        fontStyle: 'normal',
        fontDisplay: 'swap'
      }
    ]
  }
})
```

Then expose the font names to css variables.

```css
:root {
  --font-fira-code: 'Fira Code Variable', monospace;
}
```

You can also use [globalVars](/docs/concepts/writing-styles#global-vars) in your panda config to define the variables.

```js
export default defineConfig({
  globalVars: {
    '--font-fira-code': 'Fira Code Variable, monospace'
  }
})
```

## Update Panda Config

```js
export default defineConfig({
  theme: {
    extend: {
      tokens: {
        fonts: {
          fira: { value: 'var(--font-fira-code), Menlo, monospace' },
          mona: { value: 'var(--font-mona-sans), sans-serif' }
        }
      }
    }
  }
})
```

## Use the custom fonts

```jsx
import { css } from '../styled-system/css'

function Page() {
  return (
    <div>
      <h1 className={css({ fontFamily: 'mona' })}>Mona Sans</h1>
      <code className={css({ fontFamily: 'fira' })}>Fira Code</code>
    </div>
  )
}
```
