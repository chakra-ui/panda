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
})
