import { describe, expect, it } from 'vitest'
import { createCompilerFromSnapshot } from '../src'
import { importMap } from './test-utils'

describe('shorthands:false + pattern transforms', () => {
  it('resolves preset-style shorthands from pattern output before emitting CSS', () => {
    const compiler = createCompilerFromSnapshot(
      {
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          shorthands: false,
          importMap,
          utilities: {
            paddingInline: { className: 'px', shorthand: ['px', 'paddingX'], values: 'spacing' },
            marginInline: { className: 'mx', shorthand: 'mx', values: 'spacing' },
            maxWidth: { className: 'max-w', values: 'sizes' },
            position: { className: 'pos', values: ['relative'] },
          },
          theme: {
            breakpoints: {
              md: '768px',
              lg: '1024px',
            },
            tokens: {
              spacing: {
                '4': { value: '1rem' },
                '6': { value: '1.5rem' },
                '8': { value: '2rem' },
              },
              sizes: { '8xl': { value: '90rem' } },
            },
          },
          patterns: {
            container: {
              transform: { kind: 'js-callback', id: 'patterns.container.transform' },
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.container.transform': () => ({
              position: 'relative',
              maxWidth: '8xl',
              mx: 'auto',
              px: { base: '4', md: '6', lg: '8' },
            }),
          },
        },
      },
      { crossFile: false },
    )

    compiler.parseFileSource('/virtual/App.tsx', `import { container } from '@panda/patterns'\ncontainer()`)

    const css = compiler.compile({ emitLayerDeclaration: false }).css
    const atoms = compiler.atoms()

    expect(atoms).toMatchInlineSnapshot(`
      [
        {
          "prop": "marginInline",
          "value": "auto",
          "conditions": [],
        },
        {
          "prop": "maxWidth",
          "value": "8xl",
          "conditions": [],
        },
        {
          "prop": "paddingInline",
          "value": 4,
          "conditions": [],
        },
        {
          "prop": "paddingInline",
          "value": 8,
          "conditions": [
            "lg",
          ],
        },
        {
          "prop": "paddingInline",
          "value": 6,
          "conditions": [
            "md",
          ],
        },
        {
          "prop": "position",
          "value": "relative",
          "conditions": [],
        },
      ]
    `)
    expect(css).toContain('margin-inline:')
    expect(css).toContain('padding-inline:')
    expect(css).not.toMatch(/\bmx:/)
    expect(css).not.toMatch(/\bpx:/)
  })
})
