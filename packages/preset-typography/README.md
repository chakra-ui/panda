# @pandacss/preset-typography

Opt-in prose typography for [Panda CSS](https://panda-css.com). Adds a `prose` recipe so you can style Markdown and CMS
HTML with size variants and semantic color tokens.

## Install

```bash
pnpm add -D @pandacss/preset-typography
```

## Usage

```ts
import { defineConfig } from '@pandacss/dev'
import typographyPreset from '@pandacss/preset-typography'

export default defineConfig({
  presets: ['@pandacss/preset-panda', typographyPreset()],
})
```

```tsx
import { prose } from '../styled-system/recipes'

export function Article({ html }: { html: string }) {
  return <div className={prose({ size: 'lg' })} dangerouslySetInnerHTML={{ __html: html }} />
}
```

Sizes: `sm` | `md` (default) | `lg` | `xl` | `2xl`. A size is one font size on the root; headings, spacing, and code are
`em` ratios of it, so a `prose` inside a smaller container scales down with it.

Rhythm is two custom properties on the root, `--prose-leading` (line height, `1.625`) and `--prose-flow` (gap between
blocks, `1.25em`). Set them on the wrapper to tighten or loosen an article:

```tsx
<article className={cx(prose(), css({ '--prose-leading': '1.5', '--prose-flow': '1em' }))} />
```

Lead paragraphs: add `class="lead"` inside the prose container.

### Options

```ts
typographyPreset({
  name: 'prose',
  className: 'prose', // only if it must differ from name
  sizes: ['sm', 'md', 'lg', 'xl', '2xl'],
  defaultSize: 'md',
  notProse: true, // or 'skip-prose'
  semanticTokens: {
    // enabled: false, // skip default prose colors
    prefix: 'prose',
    colorPalette: 'neutral',
  },
})
```

### Colors

Defaults live under `colors.prose.*` (or your `semanticTokens.prefix`) with `_dark` values. Keys the recipe reads:

| Key              | Used for                      |
| ---------------- | ----------------------------- |
| `body`           | Root text                     |
| `heading`        | `h1`–`h4`, table headers      |
| `lead`           | `.lead`                       |
| `link`           | Links                         |
| `linkDecoration` | Link underline                |
| `bold`           | `strong` / `b`                |
| `counter`        | Ordered list markers          |
| `bullet`         | Unordered list markers        |
| `hrBorder`       | Horizontal rules, kbd border  |
| `quote`          | Blockquote text               |
| `quoteBorder`    | Blockquote edge               |
| `caption`        | `figcaption`                  |
| `kbd`            | Keyboard text                 |
| `code`           | Inline code text              |
| `codeBg`         | Inline code background        |
| `preCode`        | Code block text               |
| `preBg`          | Code block background         |
| `thBorder`       | Table header / footer borders |
| `tdBorder`       | Table body row borders        |

Override any of them in your config:

```ts
export default defineConfig({
  presets: ['@pandacss/preset-panda', typographyPreset()],
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          prose: {
            link: { value: { base: '{colors.blue.700}', _dark: '{colors.blue.300}' } },
          },
        },
      },
    },
  },
})
```

If you set `semanticTokens: { enabled: false }`, define all of the keys above yourself under your chosen prefix.

### Migrating from `pandacss-preset-typography`

- Package: `@pandacss/preset-typography`
- Default size is `md` (was `base`)
- Disable default colors with `semanticTokens: { enabled: false }`

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
