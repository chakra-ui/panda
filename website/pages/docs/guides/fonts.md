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

```jsx filename="styles/font.ts"
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

### Font Source

Fontsource provides a straightforward process for installing fonts into your web application.

First you need to install the desired font package.

```bash
pnpm add @fontsource/fira-code
```

Then import the font in your project.

```jsx
import '@fontsource/fira-code'
```

Finally, you can import the css styles for the specific weight and subset you want to use.

```css filename="styles/font.css"
import '@fontsource/open-sans/500.css';

:root {
  --font-fira-code: 'Fira Code', monospace;
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
      <h1 className={css({ fontFamily: 'fira' })}>Mona Sans</h1>
      <code className={css({ fontFamily: 'mona' })}>Fira Code</code>
    </div>
  )
}
```
