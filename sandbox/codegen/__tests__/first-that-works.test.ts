import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { firstThatWorks, defineRecipe } from '@pandacss/dev'
import { firstThatWorks as firstThatWorksRuntime } from '../styled-system/css'

describe('firstThatWorks', () => {
  test('builds the value form, most-preferred first', () => {
    expect(firstThatWorks('min(60rem, 100%)', '75%')).toMatchInlineSnapshot(`"firstThatWorks(min(60rem, 100%), 75%)"`)
  })

  test('accepts three or more values', () => {
    expect(firstThatWorks('oklch(60% 0.2 30)', 'color(display-p3 1 0 0)', 'red')).toMatchInlineSnapshot(
      `"firstThatWorks(oklch(60% 0.2 30), color(display-p3 1 0 0), red)"`,
    )
  })

  test('accepts numeric values', () => {
    expect(firstThatWorks('1rem', 4)).toMatchInlineSnapshot(`"firstThatWorks(1rem, 4)"`)
  })

  test('keeps token references written for a config recipe', () => {
    expect(firstThatWorks('oklch(45% 0.16 250)', '{colors.blue.700}')).toMatchInlineSnapshot(
      `"firstThatWorks(oklch(45% 0.16 250), {colors.blue.700})"`,
    )
  })

  test('matches the generated firstThatWorks() for the same values', () => {
    expect(firstThatWorks('min(60rem, 100%)', '75%')).toBe(firstThatWorksRuntime('min(60rem, 100%)', '75%'))
    expect(firstThatWorks('1rem', 4)).toBe(firstThatWorksRuntime('1rem', 4))
  })
})

describe('firstThatWorks types', () => {
  test('requires at least two values', () => {
    // @ts-expect-error a run needs a value to fall back to
    expectTypeOf(firstThatWorks).toBeCallableWith('75%')
  })

  test('members take the property type, so its keywords autocomplete', () => {
    defineRecipe({
      className: 'probe',
      base: { position: firstThatWorks('sticky', 'fixed') },
    })
  })

  test('an arbitrary value is still allowed, as it is for any config value', () => {
    defineRecipe({
      className: 'probe',
      base: { color: firstThatWorks('oklch(45% 0.16 250)', '{colors.blue.700}') },
    })
  })

  test('a responsive object is not a member', () => {
    defineRecipe({
      className: 'probe',
      // @ts-expect-error a member is one value, never a conditional object
      base: { color: firstThatWorks({ base: 'red' }, { base: 'blue' }) },
    })
  })

  test('members may differ in type', () => {
    defineRecipe({
      className: 'probe',
      base: { padding: firstThatWorks('clamp(1rem, 3vw, 2rem)', 4) },
    })
  })
})

describe('firstThatWorks through panda.config.ts', () => {
  // The Rust suites see the value once it is a string and the tests above see
  // what the helper returns. This is the hop in between: the config loaded and
  // bundled with the helper inside it, through cssgen, to the emitted sheet.
  // vitest runs from the sandbox root, which is where panda.config.ts lives.
  const sandbox = process.cwd()
  const outfile = join(mkdtempSync(join(tmpdir(), 'panda-ftw-')), 'styles.css')
  execFileSync('pnpm', ['exec', 'panda', 'cssgen', '--config', 'panda.react.config.ts', '--outfile', outfile], {
    cwd: sandbox,
    stdio: 'ignore',
  })
  const sheet = readFileSync(outfile, 'utf8')

  test('a globalCss rule emits both declarations, preferred last', () => {
    expect(sheet).toContain('min-height: 100vh;\n    min-height: 100dvh;')
  })

  test('a config recipe resolves the token per member and emits both declarations', () => {
    expect(sheet).toContain('color: var(--colors-blue-700);\n      color: oklch(55% 0.18 250);')
  })

  test('the generated runtime export earns the same class the build emits', () => {
    expect(sheet).toContain('.w_firstThatWorks\\(fit-content\\,_auto\\) {\n    width: auto;\n    width: fit-content;')
  })

  test('nothing reaches the sheet unexpanded', () => {
    expect(sheet).not.toContain('firstThatWorks(')
  })
})
