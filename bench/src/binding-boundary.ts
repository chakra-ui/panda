import { performance } from 'node:perf_hooks'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createConfigSnapshot } from '@pandacss/config-loader'
import * as binding from '@pandacss/compiler'
import type { Compiler } from '@pandacss/compiler'
import * as wasmBinding from '@pandacss/compiler-wasm'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)

interface Args {
  files: number
  warm: number
  repeat: number
  wasm: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { files: 200, warm: 20, repeat: 200, wasm: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--files' && argv[i + 1]) args.files = Number(argv[++i])
    else if (arg === '--warm' && argv[i + 1]) args.warm = Number(argv[++i])
    else if (arg === '--repeat' && argv[i + 1]) args.repeat = Number(argv[++i])
    else if (arg === '--no-wasm') args.wasm = false
  }
  if (!Number.isFinite(args.files) || args.files < 1) throw new Error(`Invalid --files: ${args.files}`)
  if (!Number.isFinite(args.warm) || args.warm < 0) throw new Error(`Invalid --warm: ${args.warm}`)
  if (!Number.isFinite(args.repeat) || args.repeat < 1) throw new Error(`Invalid --repeat: ${args.repeat}`)
  return args
}

const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

function createConfig() {
  return {
    cwd: '/virtual',
    outdir: 'styled-system',
    include: [],
    importMap,
    conditions: {
      _hover: '&:hover',
      _focus: '&:focus',
    },
    utilities: {
      size: {
        transform: {
          kind: 'js-callback',
          id: 'utilities.size.transform',
        },
      },
    },
    patterns: {
      stack: {
        jsxName: 'Stack',
        properties: { gap: {} },
        transform: {
          kind: 'js-callback',
          id: 'patterns.stack.transform',
        },
      },
    },
    theme: {
      recipes: {
        button: {
          className: 'button',
          base: { size: '4px', color: 'red' },
          variants: {
            tone: {
              solid: { bg: 'blue' },
              ghost: { bg: 'transparent' },
            },
          },
        },
      },
    },
  }
}

function createCallbacks() {
  return {
    'utility.transform': {
      'utilities.size.transform': (value: string) => ({ width: value, height: value }),
    },
    'pattern.transform': {
      'patterns.stack.transform': (props: { gap?: unknown }) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: props.gap,
      }),
    },
  }
}

function sourceFor(index: number): string {
  return `import { css } from '@panda/css'
import { Stack } from '@panda/jsx'
import { stack } from '@panda/patterns'
import { button } from '@panda/recipes'

export const a${index} = css({
  size: '4px',
  color: 'red',
  _hover: { size: '8px', color: 'blue' },
})

export const b${index} = stack({ gap: '${(index % 6) + 1}' })
export const c${index} = button({ tone: '${index % 2 === 0 ? 'solid' : 'ghost'}' })
export const el${index} = <Stack gap="${(index % 4) + 2}" />
`
}

function ms(value: number) {
  return Number(value.toFixed(3))
}

function measure<T>(fn: () => T): { value: T; ms: number } {
  const start = performance.now()
  const value = fn()
  return { value, ms: performance.now() - start }
}

async function measureAsync<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = performance.now()
  const value = await fn()
  return { value, ms: performance.now() - start }
}

function runProject(project: Compiler, sources: Array<{ path: string; source: string }>, repeat: number) {
  const cold = measure(() => {
    for (const item of sources) project.parseFileSource(item.path, item.source)
  })

  const hotFile = sources[Math.floor(sources.length / 2)]
  for (let i = 0; i < repeat; i++) project.parseFileSource(hotFile.path, hotFile.source)

  const repeated = measure(() => {
    for (let i = 0; i < repeat; i++) project.parseFileSource(hotFile.path, hotFile.source)
  })
  const atoms = measure(() => project.atoms().length)
  const encodedRecipes = measure(() => project.encodedRecipes())

  return {
    coldParseMs: ms(cold.ms),
    repeatedParseMs: ms(repeated.ms),
    repeatedParsePerCallMs: ms(repeated.ms / repeat),
    atomsMs: ms(atoms.ms),
    atomCount: atoms.value,
    encodedRecipesMs: ms(encodedRecipes.ms),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sources = Array.from({ length: args.files }, (_, index) => ({
    path: `/virtual/File${index}.tsx`,
    source: sourceFor(index),
  }))
  const snapshot = createConfigSnapshot(createConfig() as any)
  const callbacks = createCallbacks()

  const napiLoad = measure(() =>
    binding.createCompilerFromSnapshot(snapshot, {
      callbacks,
      crossFile: false,
    }),
  )
  for (let i = 0; i < args.warm; i++) napiLoad.value.parseFileSource(sources[0].path, sources[0].source)

  const result: Record<string, unknown> = {
    scenario: 'binding-boundary',
    files: args.files,
    repeat: args.repeat,
    napi: {
      configLoadMs: ms(napiLoad.ms),
      ...runProject(napiLoad.value, sources, args.repeat),
    },
  }

  const wasmBundle = resolve(repoRoot, 'packages/compiler-wasm/pkg-node/compiler_wasm.js')
  if (args.wasm && existsSync(wasmBundle)) {
    const wasmLoad = await measureAsync(() =>
      wasmBinding.createCompilerFromSnapshot(snapshot, {
        callbacks,
      }),
    )
    for (let i = 0; i < args.warm; i++) wasmLoad.value.parseFileSource(sources[0].path, sources[0].source)

    result.wasm = {
      configLoadMs: ms(wasmLoad.ms),
      ...runProject(wasmLoad.value as unknown as Compiler, sources, args.repeat),
    }
  }

  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    process.exitCode = 1
    console.error(error)
  })
  .finally(() => {
    binding.shutdownTracing()
  })
