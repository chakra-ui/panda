import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createProject } from './test-utils'

type CssRuntime = {
  css: (styles: Record<string, unknown>) => string
}

describe('generated runtime/cssgen parity', () => {
  it('uses the same important class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        zIndex: { className: 'z' },
        color: { className: 'c' },
      },
      conditions: {
        hover: '&:hover',
      },
    })

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ zIndex: '1002 !important', _hover: { color: 'red.500 !important' } })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ zIndex: '1002 !important', _hover: { color: 'red.500 !important' } })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('z_1002! hover:c_red.500!')
    expect(generatedCss).toContain(String.raw`.z_1002\!`)
    expect(generatedCss).toContain(String.raw`.hover\:c_red\.500\!:hover`)
  })

  it('uses the same object-map literal class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        marginBottom: { className: 'mb', values: { '2': '0.5rem' } },
        minHeight: { className: 'min-h', values: { screen: '100vh' } },
        width: { className: 'w', values: { screen: '100vw' } },
      },
    })

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ marginBottom: '0.5rem', minHeight: '100vh', width: '100vw' })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ marginBottom: '0.5rem', minHeight: '100vh', width: '100vw' })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('mb_0.5rem min-h_100vh w_100vw')
    expect(generatedCss).toContain(String.raw`.mb_0\.5rem`)
    expect(generatedCss).toContain(String.raw`.min-h_100vh`)
    expect(generatedCss).toContain(String.raw`.w_100vw`)
  })
})
