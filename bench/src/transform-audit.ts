/**
 * Transform audit: every class the source transform folds into a file must be defined by that
 * project's stylesheet. Runs each real project in the repo with its own config, transforms every
 * source file, and checks each class-shaped token the transform introduced against the generated CSS.
 *
 *   pnpm --filter=./bench transform-audit              # every project with a panda config
 *   pnpm --filter=./bench transform-audit website      # specific projects
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createNodeDriver } from '@pandacss/compiler'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

/** Classes the runtime also returns but whose styles are empty, so the stylesheet has no rule. */
const EMPTY_RULES: Record<string, Record<string, string>> = {
  website: {
    'textLink--tone_default': 'the `textLink` recipe declares `tone.default: {}`',
    'focus:sr_false': '`srOnly: false` resolves to no declarations',
  },
}

const SOURCE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js', 'vue', 'svelte', 'astro']
const SKIPPED_DIRECTORIES = ['node_modules', 'styled-system', '.next', 'dist']
const TOOLING_CONFIG = /(panda|vite|postcss|next|astro|svelte)\.config\./
const STRING_LITERAL = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g

function projectsWithConfig(): string[] {
  const candidates = ['website', 'playground', ...readdir('sandbox').map((name) => `sandbox/${name}`)]
  return candidates.filter((project) =>
    ['ts', 'mjs', 'js'].some((ext) => existsSync(join(repoRoot, project, `panda.config.${ext}`))),
  )
}

function readdir(path: string): string[] {
  return execFileSync('ls', [join(repoRoot, path)], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
}

function sourceFiles(cwd: string): string[] {
  const prune = SKIPPED_DIRECTORIES.flatMap((name) => ['-path', `*/${name}`, '-prune', '-o'])
  const names = SOURCE_EXTENSIONS.flatMap((ext, i) => [...(i ? ['-o'] : []), '-name', `*.${ext}`])
  return execFileSync('find', [cwd, ...prune, '(', ...names, ')', '-type', 'f', '-print'], { encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && !file.endsWith('.d.ts') && !TOOLING_CONFIG.test(file))
}

/** String literal contents with JS escapes resolved, so `\"` compares as `"`. */
function stringLiterals(code: string): string[] {
  return [...code.matchAll(STRING_LITERAL)].map(([, , text]) => {
    try {
      return JSON.parse(`"${text!.replace(/\\'/g, "'").replace(/(?<!\\)"/g, '\\"')}"`) as string
    } catch {
      return text!
    }
  })
}

function definedNames(css: string): Set<string> {
  const names = new Set([...css.matchAll(/\.((?:\\.|[\w-])+)/g)].map(([, name]) => name!.replace(/\\(.)/g, '$1')))
  // Keyframe and position-try names appear in folded output as values, not classes.
  for (const [, name] of css.matchAll(/@(?:keyframes|position-try)\s+([\w-]+)/g)) names.add(name!)
  return names
}

interface Report {
  files: number
  changed: number
  checked: number
  missing: Map<string, string>
}

async function audit(
  project: string,
  getMergeKey: (token: string, separator: string) => string | null,
  createSourceTransformer: any,
): Promise<Report> {
  const cwd = join(repoRoot, project)
  const driver = await createNodeDriver({ cwd })
  const compiler = driver.compiler
  const separator = (driver.config as { separator?: string }).separator ?? '_'
  const files = sourceFiles(cwd)
  compiler.parseFiles(files)
  const defined = definedNames(
    compiler.getLayerCss({ layers: ['reset', 'base', 'tokens', 'recipes', 'utilities'] }).css,
  )
  const allowed = EMPTY_RULES[project] ?? {}

  const transformer = createSourceTransformer(compiler)
  const report: Report = { files: files.length, changed: 0, checked: 0, missing: new Map() }
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const result = transformer.transformSource({ path: file, source })
    if (!result.changed) continue
    report.changed++
    const authored = new Set(stringLiterals(source).flatMap((text) => text.split(/\s+/)))
    for (const text of stringLiterals(result.code)) {
      for (const token of text.split(/\s+/)) {
        // Skip what the author wrote, `className__slot` hooks, templates, and non-Panda classes.
        if (!token || authored.has(token) || token.includes('__') || token.includes('${')) continue
        if (getMergeKey(token, separator) === null) continue
        report.checked++
        if (!defined.has(token) && !(token in allowed) && !report.missing.has(token)) {
          report.missing.set(token, relative(repoRoot, file))
        }
      }
    }
  }
  return report
}

async function main() {
  const transformerDist = join(repoRoot, 'packages', 'transformer', 'dist', 'index.js')
  const { createSourceTransformer, getMergeKey } = await import(pathToFileURL(transformerDist).href)
  const projects = process.argv.slice(2).length ? process.argv.slice(2) : projectsWithConfig()

  let failures = 0
  for (const project of projects) {
    const report = await audit(project, getMergeKey, createSourceTransformer)
    const status = report.missing.size ? `\x1b[31m${report.missing.size} missing\x1b[0m` : '\x1b[32mok\x1b[0m'
    console.log(
      `${project.padEnd(24)} ${String(report.files).padStart(4)} files · ${String(report.changed).padStart(3)} changed · ${String(report.checked).padStart(5)} folded classes · ${status}`,
    )
    for (const [token, file] of report.missing) console.log(`  missing ${JSON.stringify(token)}  (${file})`)
    failures += report.missing.size
  }
  if (failures) {
    console.log(`\n${failures} folded classes have no rule in their stylesheet.`)
    process.exitCode = 1
  }
}

main()
