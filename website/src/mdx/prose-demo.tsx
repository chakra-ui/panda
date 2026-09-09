'use client'

import { css, cx } from '@/styled-system/css'
import { prose } from '@/styled-system/recipes'
import { useState } from 'react'

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const SIZES: Size[] = ['sm', 'md', 'lg', 'xl', '2xl']

/** Raw HTML, as a CMS or Markdown renderer would hand it over. Nothing here carries a class. */
const ARTICLE = `
<h1>Shipping a token change without a redesign</h1>
<p class="lead">
  A design system earns its keep the first time a color changes and nobody has to open a component.
  Here is how that goes when the tokens are the contract.
</p>
<p>
  Every component reads roles, not values: <code>bg: 'surface'</code>, <code>color: 'fg.muted'</code>.
  The palette behind those roles lives in one file. Change the file, and the change lands everywhere
  the role is used, in light and dark, with no search and replace.
</p>
<h2>What a change looks like</h2>
<p>Three steps, and the last one is the only one that touches code:</p>
<ol>
  <li>Design picks the new value in the token sheet.</li>
  <li>The sheet exports to <code>tokens.json</code>.</li>
  <li>The config reads the JSON and the build regenerates the CSS variables.</li>
</ol>
<blockquote>
  <p>The best token change is the one no component author finds out about.</p>
</blockquote>
<h3>Where roles come from</h3>
<p>A role names a job, not a color. The usual starting set is small:</p>
<ul>
  <li><strong>canvas</strong> and <strong>surface</strong> for the page and the cards on it</li>
  <li><strong>fg</strong> with <em>muted</em> and <em>subtle</em> steps for text</li>
  <li><strong>accent</strong> for the one color that means "act here"</li>
</ul>
<table>
  <thead>
    <tr><th>Role</th><th>Light</th><th>Dark</th></tr>
  </thead>
  <tbody>
    <tr><td><code>surface</code></td><td>white</td><td>gray.800</td></tr>
    <tr><td><code>fg</code></td><td>gray.900</td><td>gray.50</td></tr>
    <tr><td><code>accent</code></td><td>blue.600</td><td>blue.300</td></tr>
  </tbody>
</table>
<h3>In the config</h3>
<pre><code>semanticTokens: {
  colors: {
    surface: { value: { base: '{colors.white}', _dark: '{colors.gray.800}' } },
    accent: { value: { base: '{colors.blue.600}', _dark: '{colors.blue.300}' } }
  }
}</code></pre>
<p>
  Press <kbd>⌘</kbd> <kbd>S</kbd> and the dev server picks it up. Read more in the
  <a href="/docs/theming/tokens">tokens guide</a>.
</p>
<hr />
<p>That is the whole workflow. The rest of this page is about how this article is styled.</p>
`

export const ProseDemo = () => {
  const [size, setSize] = useState<Size>('md')

  return (
    <div className={frame}>
      <div className={toolbar}>
        <span className={label}>size</span>
        <div className={group} role="group" aria-label="Prose size">
          {SIZES.map(value => (
            <button
              key={value}
              type="button"
              data-selected={size === value || undefined}
              className={option}
              onClick={() => setSize(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className={cx('scroll-area', canvas)}>
        <div
          className={prose({ size })}
          dangerouslySetInnerHTML={{ __html: ARTICLE }}
        />
      </div>
    </div>
  )
}

const frame = css({
  my: '8',
  borderWidth: '1px',
  borderColor: 'border',
  rounded: 'xl',
  overflow: 'hidden'
})

const toolbar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '4',
  py: '2',
  borderBottomWidth: '1px',
  borderColor: 'border',
  bg: 'bg.subtle'
})

const label = css({
  textStyle: 'eyebrow',
  color: 'fg.subtle'
})

const group = css({
  display: 'inline-flex',
  gap: '1'
})

const option = css({
  px: '2.5',
  py: '1',
  rounded: 'md',
  fontSize: 'sm',
  fontFamily: 'mono',
  color: 'fg.muted',
  cursor: 'pointer',
  '&:not([data-selected])': { _hover: { bg: 'bg.muted' } },
  '&[data-selected]': { bg: 'fg', color: 'bg' }
})

const canvas = css({
  px: { base: '5', md: '10' },
  py: { base: '8', md: '12' },
  bg: 'bg',
  maxH: '40rem',
  overflowY: 'auto'
})
