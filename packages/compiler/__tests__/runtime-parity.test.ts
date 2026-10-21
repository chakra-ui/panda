import { describe, expect, it } from 'vitest'
import { loadGeneratedModule } from './generated-runtime'
import { createProject } from './test-utils'

type CssRuntime = {
  css: (styles: Record<string, unknown>) => string
}

function unescapeCss(selector: string) {
  return selector
    .replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1')
}

function classSelectors(css: string) {
  const names = new Set<string>()
  for (const match of css.matchAll(/\.((?:\\.|[^\s.,:{\\])+)/g)) names.add(unescapeCss(match[1]))
  return names
}

type ViewTransitionRuntime = {
  viewTransition: (options: Record<string, unknown> | string) => string
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

  it('uses the same multiline string value class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        margin: { className: 'm' },
      },
    })

    const margin = `
      1rem
      2rem
    `

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ margin: \`
         1rem
         2rem
       \` })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ margin })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('m_1rem_2rem')
    expect(generatedCss).toContain(String.raw`.m_1rem_2rem`)
    expect(generatedCss).toContain('margin: 1rem 2rem;')
  })

  it('uses the same repeated whitespace value class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        margin: { className: 'm' },
      },
    })

    const margin = '1rem\t  2rem'

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ margin: '1rem\t  2rem' })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ margin })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('m_1rem_2rem')
    expect(generatedCss).toContain(String.raw`.m_1rem_2rem`)
    expect(generatedCss).toContain('margin: 1rem 2rem;')
  })

  it('uses the same important multiline value class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        margin: { className: 'm' },
      },
    })

    const margin = `
      1rem
      2rem
      !important
    `

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ margin: \`
         1rem
         2rem
         !important
       \` })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ margin })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('m_1rem_2rem!')
    expect(generatedCss).toContain(String.raw`.m_1rem_2rem\!`)
    expect(generatedCss).toContain('margin: 1rem 2rem !important;')
  })

  it('uses the same conditional whitespace value class names as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      utilities: {
        margin: { className: 'm' },
      },
      conditions: {
        hover: '&:hover',
      },
    })

    const margin = '1rem\t2rem'

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ _hover: { margin: '1rem\t2rem' } })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ _hover: { margin } })
    const generatedCss = compiler.compile({ emitLayerDeclaration: false }).css

    expect(className).toBe('hover:m_1rem_2rem')
    expect(generatedCss).toContain(String.raw`.hover\:m_1rem_2rem:hover`)
    expect(generatedCss).toContain('margin: 1rem 2rem;')
  })

  it('uses the same grid template areas class names as cssgen', async () => {
    const compiler = createProject({ outExtension: 'mjs' })

    const gridTemplateAreas = `
      "preview name delete"
      "preview size delete"
    `

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css';
       css({ gridTemplateAreas: \`
         "preview name delete"
         "preview size delete"
       \` })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ gridTemplateAreas })
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('grid-template-areas_"preview_name_delete"_"preview_size_delete"')
    expect(utilitiesCss).toMatchInlineSnapshot(`
      "@layer utilities {
        .grid-template-areas_\\"preview_name_delete\\"_\\"preview_size_delete\\" {
          grid-template-areas: "preview name delete" "preview size delete";
        }
      }
      "
    `)
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

  it('uses the same viewTransition bag class as cssgen', async () => {
    const compiler = createProject({ outExtension: 'mjs' })
    const options = {
      group: { animationDuration: '0.4s' },
      old: { opacity: 0 },
      new: { opacity: 1 },
    }

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { viewTransition } from '@panda/css';
       viewTransition({
         group: { animationDuration: '0.4s' },
         old: { opacity: 0 },
         new: { opacity: 1 },
       })`,
    )

    const runtime = await loadGeneratedModule<ViewTransitionRuntime>(compiler, {
      entry: 'css/view-transition.mjs',
    })
    const className = runtime.viewTransition(options)
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('vt_kXwuyX')
    expect(utilitiesCss).toContain(`.${className}`)
    expect(utilitiesCss).toContain(`view-transition-class: ${className};`)
    expect(utilitiesCss).toContain(`::view-transition-group(.${className})`)
    expect(utilitiesCss).toContain(`::view-transition-old(.${className})`)
    expect(utilitiesCss).toContain(`::view-transition-new(.${className})`)
  })

  it('uses the same prefixed viewTransition bag class as cssgen', async () => {
    const compiler = createProject({ outExtension: 'mjs', prefix: 'pd' })
    const options = {
      old: { opacity: 0 },
      new: { opacity: 1 },
    }

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { viewTransition } from '@panda/css';
       viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } })`,
    )

    const runtime = await loadGeneratedModule<ViewTransitionRuntime>(compiler, {
      entry: 'css/view-transition.mjs',
    })
    const className = runtime.viewTransition(options)
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('pd-vt_gnOaDr')
    expect(utilitiesCss).toContain(`.${className}`)
    expect(utilitiesCss).toContain(`view-transition-class: ${className};`)
  })

  it('viewTransition runtime hash ignores unknown keys like the compiler', async () => {
    const compiler = createProject({ outExtension: 'mjs' })
    const options = {
      old: { opacity: 0 },
      new: { opacity: 1 },
      ignored: true,
    }

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { viewTransition } from '@panda/css';
       viewTransition({
         old: { opacity: 0 },
         new: { opacity: 1 },
         ignored: true,
       })`,
    )

    const runtime = await loadGeneratedModule<ViewTransitionRuntime>(compiler, {
      entry: 'css/index.mjs',
    })
    const className = runtime.viewTransition(options)
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('vt_gnOaDr')
    expect(className).toBe(runtime.viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } }))
    expect(utilitiesCss).toContain(`.${className}`)
  })

  it('uses the same named theme viewTransition class as cssgen', async () => {
    const compiler = createProject({
      outExtension: 'mjs',
      theme: {
        viewTransitions: {
          slide: {
            old: { opacity: 0 },
            new: { opacity: 1 },
          },
        },
      },
    })

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { viewTransition } from '@panda/css';
       viewTransition('slide')`,
    )

    const runtime = await loadGeneratedModule<ViewTransitionRuntime>(compiler, {
      entry: 'css/view-transition.mjs',
    })
    const className = runtime.viewTransition('slide')
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('vt_slide')
    expect(utilitiesCss).toContain('.vt_slide')
    expect(utilitiesCss).toContain('view-transition-class: vt_slide;')
    expect(utilitiesCss).toContain('::view-transition-old(.vt_slide)')
    expect(utilitiesCss).not.toContain('vt_fade')
  })

  it('keeps extra spaces in grid template areas css and matches the runtime class', async () => {
    const compiler = createProject({ outExtension: 'mjs' })

    const gridTemplateAreas = [``, `  "col1  col2"`, `  "col3 col4"`, ``].join('\n')

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css'; css({ gridTemplateAreas: ${JSON.stringify(gridTemplateAreas)} })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ gridTemplateAreas })
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('grid-template-areas_"col1_col2"_"col3_col4"')
    expect(classSelectors(utilitiesCss)).toContain(className)
    expect(utilitiesCss).toContain('grid-template-areas: "col1  col2" "col3 col4";')
  })

  it('keeps tabs inside quoted content out of the class name', async () => {
    const compiler = createProject({ outExtension: 'mjs' })

    const content = '"a\tb"'

    compiler.parseFileSource(
      '/virtual/app.ts',
      `import { css } from '@panda/css'; css({ content: ${JSON.stringify(content)} })`,
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const className = runtime.css({ content })
    const utilitiesCss = compiler.getLayerCss({ layers: ['utilities'] }).css

    expect(className).toBe('content_"a_b"')
    expect(classSelectors(utilitiesCss)).toContain(className)
    expect(utilitiesCss).toContain('content: "a\tb";')
  })

  it('uses the same class as cssgen for tricky whitespace values', async () => {
    const styleValues = [
      '1px  solid   red',
      '1rem\t\n 2rem',
      '"col1  col2" "col3 col4"',
      '\n  "col1  col2"\n  "col3 col4"\n',
      '"a\tb"',
      "'a  b'",
      'attr(title)  "  x  "',
      '"open  run',
      '1px\u00a0\u00a0solid',
      'a\u2028b',
      'a\ufeffb',
      'a\u0085b',
      '1rem  2rem  !important',
      '1px solid red',
    ]
    const compiler = createProject({ outExtension: 'mjs' })

    compiler.parseFileSource(
      '/virtual/app.ts',
      [
        `import { css } from '@panda/css'`,
        ...styleValues.map((value) => `css({ content: ${JSON.stringify(value)} })`),
      ].join('\n'),
    )

    const runtime = await loadGeneratedModule<CssRuntime>(compiler, { entry: 'css/css.mjs' })
    const selectors = classSelectors(compiler.getLayerCss({ layers: ['utilities'] }).css)

    for (const value of styleValues) {
      expect(selectors, JSON.stringify(value)).toContain(runtime.css({ content: value }))
    }
  })
})
