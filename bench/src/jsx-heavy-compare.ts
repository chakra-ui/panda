import { performance } from 'node:perf_hooks'
import { createCompilerFromSnapshot } from '@pandacss/compiler'
import { createConfigSnapshot } from '@pandacss/config-loader'
import { extract as jsExtract } from '@pandacss/extractor'
import { Project, ts } from 'ts-morph'

interface Args {
  elements: number
  warm: number
  iterations: number
}

const rustConfig = {
  cwd: '/virtual',
  outdir: 'styled-system',
  include: [],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  jsxFactory: 'styled',
}
const rustSnapshot = createConfigSnapshot(rustConfig)

const componentNames = new Set(['Box', 'Stack', 'Grid', 'styled.div'])
const functionNames = new Set(['css'])

function main() {
  const args = parseArgs(process.argv.slice(2))
  const source = generatedSource(args.elements)
  const path = 'fixture.tsx'

  const project = new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: 'React.createElement',
      jsxFragmentFactory: 'React.Fragment',
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noEmit: true,
      allowJs: true,
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    useVirtualFileSystem: true,
  } as any)

  const rustExtractor = createCompilerFromSnapshot(rustSnapshot)

  for (let i = 0; i < args.warm; i++) {
    runJs(project, source, path)
    rustExtractor.extractFileSource(path, source)
  }

  const jsStart = performance.now()
  let jsChecksum = 0
  for (let i = 0; i < args.iterations; i++) {
    jsChecksum += runJs(project, source, path)
  }
  const jsMs = performance.now() - jsStart

  const rustStart = performance.now()
  let rustChecksum = 0
  for (let i = 0; i < args.iterations; i++) {
    const result = rustExtractor.extractFileSource(path, source)
    rustChecksum += result.calls.length + result.jsx.length + result.diagnostics.length
  }
  const rustMs = performance.now() - rustStart

  console.log(
    JSON.stringify(
      {
        scenario: 'jsx-heavy-direct-extract',
        elements: args.elements,
        bytes: Buffer.byteLength(source),
        iterations: args.iterations,
        js: {
          totalMs: ms(jsMs),
          perIterationMs: ms(jsMs / args.iterations),
          checksum: jsChecksum,
        },
        rust: {
          totalMs: ms(rustMs),
          perIterationMs: ms(rustMs / args.iterations),
          checksum: rustChecksum,
        },
        speedup: `${(jsMs / rustMs).toFixed(2)}x`,
      },
      null,
      2,
    ),
  )
}

function runJs(project: Project, source: string, path: string): number {
  const sourceFile = project.createSourceFile(path, source, {
    overwrite: true,
    scriptKind: ts.ScriptKind.TSX,
  })
  const result = jsExtract({
    ast: sourceFile,
    components: {
      matchTag: ({ tagName }) => componentNames.has(tagName),
      matchProp: () => true,
    },
    functions: {
      matchFn: ({ fnName }) => functionNames.has(fnName),
      matchProp: () => true,
      matchArg: () => true,
    },
    flags: { skipTraverseFiles: true },
  })
  let count = 0
  for (const item of result.values()) count += item.queryList.length
  return count
}

function parseArgs(argv: string[]): Args {
  const args: Args = { elements: 2_000, warm: 10, iterations: 50 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--elements' && argv[i + 1]) args.elements = Number(argv[++i])
    else if (arg === '--warm' && argv[i + 1]) args.warm = Number(argv[++i])
    else if (arg === '--iterations' && argv[i + 1]) args.iterations = Number(argv[++i])
  }
  if (!Number.isFinite(args.elements) || args.elements < 1) throw new Error(`Invalid --elements: ${args.elements}`)
  if (!Number.isFinite(args.warm) || args.warm < 0) throw new Error(`Invalid --warm: ${args.warm}`)
  if (!Number.isFinite(args.iterations) || args.iterations < 1) {
    throw new Error(`Invalid --iterations: ${args.iterations}`)
  }
  return args
}

function ms(value: number): number {
  return Number(value.toFixed(3))
}

function generatedSource(elements: number): string {
  let source = `import { css } from '@panda/css';
import { Box, Stack, Grid, styled } from '@panda/jsx';
import { button, card } from '@panda/recipes';
const shared = { color: 'red', padding: '4' };
export function Fixture() {
return <>
`
  for (let index = 0; index < elements; index++) {
    switch (index % 8) {
      case 0:
        source += `<Box color='red' padding='4' css={{ bg: 'blue' }} />\n`
        break
      case 1:
        source += `<Stack gap='3' {...shared} />\n`
        break
      case 2:
        source += `<Grid display='grid' margin='2' />\n`
        break
      case 3:
        source += `<styled.div color='green' />\n`
        break
      case 4:
        source += `<PrimaryAction color='purple' />\n`
        break
      case 5:
        source += `<FieldInput bg='gray.100' />\n`
        break
      case 6:
        source += `<button.Root size='md' />\n`
        break
      default:
        source += `<div data-id='skip' />\n`
        break
    }
  }
  source += `</>;
}
css({ color: 'red' });
`
  return source
}

main()
