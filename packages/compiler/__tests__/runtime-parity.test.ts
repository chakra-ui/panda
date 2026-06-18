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

  it('uses the same vendor-prefixed property class names as cssgen', async () => {
    const compiler = createProject({ outExtension: 'mjs' })

    const styles = {
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      MozAppearance: 'none',
    }

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', MozAppearance: 'none' })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css(styles)
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('-webkit-background-clip_text -webkit-text-fill-color_transparent -moz-appearance_none')
    expect(generatedCss).toContain(String.raw`.\-webkit-background-clip_text`)
    expect(generatedCss).toContain(String.raw`.\-webkit-text-fill-color_transparent`)
    expect(generatedCss).toContain(String.raw`.\-moz-appearance_none`)
    expect(generatedCss).toContain('-webkit-background-clip: text;')
    expect(generatedCss).toContain('-webkit-text-fill-color: transparent;')
    expect(generatedCss).toContain('-moz-appearance: none;')
  })

  it('uses the same custom property class names as cssgen', async () => {
    const compiler = createProject({ outExtension: 'mjs' })

    const styles = {
      '--ring': '2px',
      '--welcome-x': 20,
    }

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ '--ring': '2px', '--welcome-x': 20 })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css(styles)
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('--ring_2px --welcome-x_20')
    expect(generatedCss).toContain(String.raw`.\--ring_2px`)
    expect(generatedCss).toContain(String.raw`.\--welcome-x_20`)
    expect(generatedCss).toContain('--ring: 2px;')
    expect(generatedCss).toContain('--welcome-x: 20;')
  })
})
