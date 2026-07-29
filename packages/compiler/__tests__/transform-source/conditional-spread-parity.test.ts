import { beforeAll, describe, expect, test } from 'vitest'
import { loadGeneratedModule } from '../generated-runtime'
import { createTransformProject } from '../test-utils'

type CssRuntime = {
  css: (styles: Record<string, unknown>) => string
}

const compiler = createTransformProject({
  outExtension: 'mjs',
  conditions: { hover: '&:hover' },
  utilities: { color: {}, margin: {}, padding: {}, paddingTop: {} },
})

let runtime: CssRuntime

beforeAll(async () => {
  runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
})

/**
 * The transform folds a conditional spread into branch class strings by
 * reasoning about the spread statically. The runtime `css()` sees the object
 * JavaScript actually built. Those two must agree, or a build produces
 * different styles than a dev-time runtime render.
 *
 * `styles` is the single source of truth: it is compiled as source text *and*
 * evaluated as a real object literal, so the two sides can't drift apart.
 */
async function expectSpreadParity(styles: string) {
  const source = [`import { css } from '@panda/css'`, `export const make = (b) => css(${styles})`].join('\n')
  const { code } = compiler.transformSource({ path: 'src/app.tsx', source })

  // A fully folded call leaves no runtime import behind — and the module has to
  // be importable on its own for the evaluation below.
  expect(code).not.toMatch(/\bimport\b/)

  const module = (await import(
    /* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  )) as { make: (b: unknown) => string }
  const buildStyles = new Function('b', `return (${styles})`) as (b: unknown) => Record<string, unknown>

  for (const branch of [true, false]) {
    expect({ branch, classes: sorted(module.make(branch)) }).toEqual({
      branch,
      classes: sorted(runtime.css(buildStyles(branch))),
    })
  }
}

/** Class order in an attribute doesn't affect the cascade; membership does. */
function sorted(classes: string) {
  return classes.split(/\s+/).filter(Boolean).sort()
}

describe('compiler.transformSource: conditional spread matches the css() runtime', () => {
  test('a branch that omits a key keeps the base value', async () => {
    await expectSpreadParity(`{ padding: '2', color: 'green', ...(b ? { padding: '1' } : {}) }`)
  })

  test('each branch keeps the base values the other one overrides', async () => {
    await expectSpreadParity(`{ padding: '2', margin: '3', ...(b ? { padding: '1' } : { margin: '4' }) }`)
  })

  test('a logical spread keeps the base value it overrides', async () => {
    await expectSpreadParity(`{ padding: '2', color: 'green', ...(b && { padding: '1' }) }`)
  })

  test('a later static property overrides both branches', async () => {
    await expectSpreadParity(`{ padding: '2', ...(b ? { padding: '1' } : {}), padding: '5' }`)
  })

  test('a spread shorthand does not replace the base longhand', async () => {
    await expectSpreadParity(`{ paddingTop: '2', ...(b ? { padding: '1' } : {}) }`)
  })

  test('a nested condition object falls back within its own scope', async () => {
    await expectSpreadParity(`{ _hover: { padding: '2', margin: '3', ...(b ? { padding: '1' } : { margin: '4' }) } }`)
  })

  test('a spread replaces a nested condition object wholesale', async () => {
    await expectSpreadParity(`{ _hover: { padding: '2' }, ...(b ? { _hover: { color: 'red' } } : {}) }`)
  })
})
