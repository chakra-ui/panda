import { posix } from 'node:path'
import { createCompiler } from '@pandacss/compiler'
import { rolldown } from 'rolldown'
import { getInternalCssRuntimeSource, INTERNAL_CSS_IMPORT, INTERNAL_CSS_RESOLVED_ID } from '../../src'

type Compiler = ReturnType<typeof createCompiler>

export function createFixtureCompiler() {
  return createCompiler({
    cwd: '/virtual',
    outdir: 'styled-system',
    outExtension: 'mjs',
    jsxFramework: 'react',
    jsxFactory: 'styled',
    importMap: {
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns'],
      jsx: ['@panda/jsx'],
      tokens: ['@panda/tokens'],
    },
    utilities: {
      backgroundColor: { className: 'bg', shorthand: 'bg' },
      borderRadius: { className: 'bdr' },
      fontSize: { className: 'fs' },
    },
  })
}

/** Just enough React for the generated styled-system runtime, plus a renderer that walks the element tree. */
const REACT_STUB = `
export function createElement(type, props, ...children) {
  const next = { ...props }
  if (children.length) next.children = children.length === 1 ? children[0] : children
  return { type, props: next }
}
export function forwardRef(render) {
  return (props) => render(props, props.ref ?? null)
}
export function createContext(value) {
  const context = { value }
  context.Provider = { context }
  return context
}
export function useContext(context) {
  return context.value
}
export function render(node) {
  if (Array.isArray(node)) return node.map(render)
  if (!node || typeof node !== 'object' || !('type' in node)) return node
  const { type, props } = node
  if (typeof type === 'function') return render(type(props))
  if (type.context) {
    const previous = type.context.value
    type.context.value = props.value
    const out = render(props.children)
    type.context.value = previous
    return out
  }
  return { type, className: props.className, children: render(props.children) }
}
`

interface BundleOptions {
  format?: 'esm' | 'cjs'
  /** Resolve `@styled-system/css` to the generated css entry, outside the transform's import map. */
  exposeRuntime?: boolean
  /** More source modules next to the entry, keyed by path (e.g. `/button.js`). */
  modules?: Record<string, string>
}

export async function bundle(compiler: Compiler, code: string, options: BundleOptions = {}) {
  const modules = new Map<string, string>([['/entry.tsx', code], ...Object.entries(options.modules ?? {})])
  for (const artifact of compiler.generateArtifacts()) {
    for (const file of artifact.files) {
      if (file.path.endsWith('.mjs')) modules.set(posix.join('/styled-system', file.path), file.code)
    }
  }
  modules.set(INTERNAL_CSS_RESOLVED_ID, getInternalCssRuntimeSource())
  if (options.format === 'cjs') modules.set('react', REACT_STUB)

  const build = await rolldown({
    cwd: '/',
    input: '/entry.tsx',
    external: options.format === 'cjs' ? [] : ['react', 'react/jsx-runtime'],
    plugins: [
      {
        name: 'panda-styled-system-fixture',
        resolveId(source, importer) {
          if (modules.has(source)) return source
          if (source === '@panda/jsx') return '/styled-system/jsx/index.mjs'
          if (source === '@panda/css') return '/styled-system/css/index.mjs'
          if (source === '@styled-system/css' && options.exposeRuntime) return '/styled-system/css/index.mjs'
          if (source === INTERNAL_CSS_IMPORT) return INTERNAL_CSS_RESOLVED_ID
          if (!importer || !source.startsWith('.')) return null

          const resolved = posix.normalize(posix.join(posix.dirname(importer), source))
          for (const candidate of [resolved, `${resolved}.mjs`, `${resolved}.js`]) {
            if (modules.has(candidate)) return candidate
          }
          return null
        },
        load(id) {
          return modules.get(id) ?? null
        },
      },
    ],
  })

  try {
    const { output } = await build.generate({ format: options.format ?? 'esm', codeSplitting: false })
    const chunk = output.find((item) => item.type === 'chunk')
    if (!chunk || chunk.type !== 'chunk') throw new Error('expected an output chunk')
    return chunk.code
  } finally {
    await build.close()
  }
}

/** Bundle transformed source with the real generated styled-system and evaluate its exports. */
export async function run(compiler: Compiler, code: string): Promise<Record<string, any>> {
  const commonjs = await bundle(compiler, code, { format: 'cjs', exposeRuntime: true })
  const module = { exports: {} as Record<string, any> }
  new Function('module', 'exports', commonjs)(module, module.exports)
  return module.exports
}
