import { describe, expect, it } from 'vitest'
import { cssImportSpecifiers, findImportedLayerDeclaration } from '../src'

const CSS_ROOT = '@layer reset, base, tokens, recipes, utilities;'

describe('cssImportSpecifiers', () => {
  it('reads every import form', () => {
    expect(
      cssImportSpecifiers(`
        @import "a.css";
        @import 'b.css' layer(vendor);
        @import url(c.css) screen;
        @import url( "d.css" ) supports(display: grid);
        @IMPORT "e.css";
        @import"f.css";
      `),
    ).toEqual(['a.css', 'b.css', 'c.css', 'd.css', 'e.css', 'f.css'])
  })

  it('reads imports after @charset, @layer statements and comments', () => {
    expect(
      cssImportSpecifiers(
        `\uFEFF@charset "UTF-8";\n/* ; { */\n${CSS_ROOT}\n@import "a.css"; /* @import "x.css"; */\n@import "b.css";`,
      ),
    ).toEqual(['a.css', 'b.css'])
  })

  it('keeps quotes, escapes, and delimiters inside the specifier', () => {
    expect(cssImportSpecifiers(`@import "we;ird{name}.css";\n@import "esc\\"aped.css";\n@import 'it''s.css';`)).toEqual(
      ['we;ird{name}.css', 'esc"aped.css', 'it'],
    )
  })

  it('stops at the first rule, like CSS does', () => {
    expect(cssImportSpecifiers(`@import "a.css";\n.x { content: "@import 'b.css';" }\n@import "c.css";`)).toEqual([
      'a.css',
    ])
    expect(cssImportSpecifiers(`@layer app { .x {} }\n@import "a.css";`)).toEqual([])
    expect(cssImportSpecifiers(`.x { background: url(a.css) }`)).toEqual([])
  })

  it('ignores commented-out imports', () => {
    expect(cssImportSpecifiers(`/* @import "a.css"; */`)).toEqual([])
  })

  it('skips remote and data imports', () => {
    expect(
      cssImportSpecifiers(
        `@import "https://fonts.googleapis.com/css2";\n@import url(//cdn.example.com/a.css);\n@import "data:text/css,.x{}";\n@import "local.css";`,
      ),
    ).toEqual(['local.css'])
  })

  it('keeps Windows drive paths', () => {
    expect(cssImportSpecifiers(`@import "C:/styles/a.css";`)).toEqual(['C:/styles/a.css'])
  })
})

describe('findImportedLayerDeclaration', () => {
  const host = (files: Record<string, string>) => ({
    resolve: async (specifier: string) => (specifier in files ? specifier : undefined),
    read: async (file: string) => files[file]!,
    hasLayerDeclaration: (css: string) => css.includes(CSS_ROOT),
  })

  it('finds the layer declaration through nested imports', async () => {
    const files = { 'a.css': '@import "b.css";', 'b.css': '@import "c.css";', 'c.css': CSS_ROOT }

    expect(await findImportedLayerDeclaration('@import "a.css";', 'index.css', host(files))).toEqual({
      found: true,
      files: ['a.css', 'b.css', 'c.css'],
    })
  })

  it('reports every visited file when nothing declares the layers', async () => {
    const files = { 'a.css': '@import "b.css";', 'b.css': '.b {}' }

    expect(
      await findImportedLayerDeclaration('@import "a.css";\n@import "missing.css";', 'index.css', host(files)),
    ).toEqual({
      found: false,
      files: ['a.css', 'b.css'],
    })
  })

  it('stops on import cycles', async () => {
    const files = { 'a.css': '@import "b.css";', 'b.css': '@import "a.css";\n@import "index.css";' }

    expect(await findImportedLayerDeclaration('@import "a.css";', 'index.css', host(files))).toEqual({
      found: false,
      files: ['a.css', 'b.css'],
    })
  })
})
