import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { RawCompiler } from '../../src/types'
import { createTransformProject } from '../test-utils'

describe('imported pattern raw values', () => {
  test('preserves repeated spread precedence and uses the current host', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-pattern-raw-'))
    try {
      const compiler = createTransformProject(
        {
          cwd: dir,
          conditions: { hover: '&:hover' },
          utilities: { gap: {}, padding: {} },
          patterns: {
            spaced: {
              properties: { gap: { type: 'string' }, padding: { type: 'string' } },
              defaultValues: { gap: '8px', padding: '2px' },
              transform: { kind: 'js-callback', id: 'patterns.spaced.transform' },
            },
          },
        },
        {
          crossFile: true,
          callbacks: {
            'pattern.transform': {
              'patterns.spaced.transform': (props) => ({ gap: props.gap, padding: props.padding }),
            },
          },
        },
      )
      const stylesPath = join(dir, 'styles.ts')
      const styles = `import { spaced } from '@panda/patterns'; export const styles = { ...spaced.raw({ gap: '4px' }), gap: '8px', ...spaced.raw({ gap: '4px' }) }`
      writeFileSync(stylesPath, styles)
      const path = join(dir, 'main.ts')
      const source = `import { css } from '@panda/css'; import { styles } from './styles'; export const cls = css({ _hover: styles })`
      compiler.parseFileSource(stylesPath, styles)
      compiler.parseFileSource(path, source)

      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_4px hover:padding_2px""`,
      )
      const emitted = compiler.compile()
      expect(emitted.diagnostics).toEqual([])
      expect(emitted.css).toMatch(/\.hover\\:gap_4px:hover\s*\{\s*gap: 4px;/)
      expect(emitted.css).not.toContain('\0')
      expect(emitted.css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_4px:hover {
            gap: 4px;
          }
        }
        "
      `)

      const raw = compiler as RawCompiler
      raw.registerPatternTransform!('patterns.spaced.transform', (props) => ({
        ...(props as Record<string, unknown>),
        gap: '6px',
      }))
      compiler.parseFileSource(path, source)
      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_6px hover:padding_2px""`,
      )
      expect(compiler.compile().css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_6px:hover {
            gap: 6px;
          }
        }
        "
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves nested pattern inputs and uses the current host', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-pattern-raw-'))
    try {
      const compiler = createTransformProject(
        {
          cwd: dir,
          conditions: { hover: '&:hover' },
          utilities: { gap: {}, padding: {} },
          patterns: {
            spaced: {
              properties: { gap: { type: 'string' }, padding: { type: 'string' } },
              defaultValues: { gap: '8px', padding: '2px' },
              transform: { kind: 'js-callback', id: 'patterns.spaced.transform' },
            },
          },
        },
        {
          crossFile: true,
          callbacks: {
            'pattern.transform': {
              'patterns.spaced.transform': (props) => ({ gap: props.gap, padding: props.padding }),
            },
          },
        },
      )
      const stylesPath = join(dir, 'styles.ts')
      const styles = `import { spaced } from '@panda/patterns'; export const styles = spaced.raw({ ...spaced.raw({ gap: '4px' }) })`
      writeFileSync(stylesPath, styles)
      const path = join(dir, 'main.ts')
      const source = `import { css } from '@panda/css'; import { styles } from './styles'; export const cls = css({ _hover: styles })`
      compiler.parseFileSource(stylesPath, styles)
      compiler.parseFileSource(path, source)

      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_4px hover:padding_2px""`,
      )
      const emitted = compiler.compile()
      expect(emitted.diagnostics).toEqual([])
      expect(emitted.css).toMatch(/\.hover\\:gap_4px:hover\s*\{\s*gap: 4px;/)
      expect(emitted.css).not.toContain('\0')
      expect(emitted.css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_4px:hover {
            gap: 4px;
          }
        }
        "
      `)

      const raw = compiler as RawCompiler
      raw.registerPatternTransform!('patterns.spaced.transform', (props) => ({
        ...(props as Record<string, unknown>),
        gap: '6px',
      }))
      compiler.parseFileSource(path, source)
      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_6px hover:padding_2px""`,
      )
      expect(compiler.compile().css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_6px:hover {
            gap: 6px;
          }
        }
        "
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('resolves destructured aliases and uses the current host', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-pattern-raw-'))
    try {
      const compiler = createTransformProject(
        {
          cwd: dir,
          conditions: { hover: '&:hover' },
          utilities: { gap: {}, padding: {} },
          patterns: {
            spaced: {
              properties: { gap: { type: 'string' }, padding: { type: 'string' } },
              defaultValues: { gap: '8px', padding: '2px' },
              transform: { kind: 'js-callback', id: 'patterns.spaced.transform' },
            },
          },
        },
        {
          crossFile: true,
          callbacks: {
            'pattern.transform': {
              'patterns.spaced.transform': (props) => ({ gap: props.gap, padding: props.padding }),
            },
          },
        },
      )
      const stylesPath = join(dir, 'styles.ts')
      const styles = `import { spaced } from '@panda/patterns'; const original = spaced.raw({ gap: '4px' }); const { root: styles } = { root: original }; export { styles }`
      writeFileSync(stylesPath, styles)
      const path = join(dir, 'main.ts')
      const source = `import { css } from '@panda/css'; import { styles } from './styles'; export const cls = css({ _hover: styles })`
      compiler.parseFileSource(stylesPath, styles)
      compiler.parseFileSource(path, source)

      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_4px hover:padding_2px""`,
      )
      const emitted = compiler.compile()
      expect(emitted.diagnostics).toEqual([])
      expect(emitted.css).toMatch(/\.hover\\:gap_4px:hover\s*\{\s*gap: 4px;/)
      expect(emitted.css).not.toContain('\0')
      expect(emitted.css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_4px:hover {
            gap: 4px;
          }
        }
        "
      `)

      const raw = compiler as RawCompiler
      raw.registerPatternTransform!('patterns.spaced.transform', (props) => ({
        ...(props as Record<string, unknown>),
        gap: '6px',
      }))
      compiler.parseFileSource(path, source)
      expect(compiler.transformSource({ path, source }).code.trim()).toMatchInlineSnapshot(
        `"import { styles } from './styles'; export const cls = "hover:gap_6px hover:padding_2px""`,
      )
      expect(compiler.compile().css).toMatchInlineSnapshot(`
        "@layer reset, base, tokens, recipes, utilities;
        @layer recipes { @layer base, slots, variants, compound_variants; }
        @layer recipes.slots { @layer base, variants, compound_variants; }
        @layer base {
          :root {
            --made-with-panda: '🐼';
          }
        }
        @layer utilities {
          .padding_2px {
            padding: 2px;
          }
          .gap_4px {
            gap: 4px;
          }
          .hover\\:padding_2px:hover {
            padding: 2px;
          }
          .hover\\:gap_6px:hover {
            gap: 6px;
          }
        }
        "
      `)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
