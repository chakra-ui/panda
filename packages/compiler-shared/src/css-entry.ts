import type { CompileOutput } from './types'
import type { Driver } from './driver'

export interface CssImportHost {
  resolve: (specifier: string, importer: string) => Promise<string | undefined>
  read: (file: string) => Promise<string>
  hasLayerDeclaration: (css: string) => boolean
}

export interface PandaStylesheet {
  code: string
  diagnostics: CompileOutput['diagnostics']
}

export function appendPandaStylesheet(driver: Driver, source: string): PandaStylesheet {
  const polyfill = driver.config.polyfill === true
  const output = driver.cssgen({ emitLayerDeclaration: false, polyfill })
  const entry = polyfill ? driver.compiler.stripLayerOrderStatements(source) : source
  return { code: `${entry}\n${output.css}`, diagnostics: output.diagnostics }
}

export interface ImportedLayerDeclaration {
  found: boolean
  files: string[]
}

export async function findImportedLayerDeclaration(
  css: string,
  importer: string,
  host: CssImportHost,
): Promise<ImportedLayerDeclaration> {
  const files: string[] = []
  const seen = new Set([importer])
  const queue = [{ css, importer }]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const specifier of cssImportSpecifiers(current.css)) {
      const file = await host.resolve(specifier, current.importer)
      if (!file || seen.has(file)) continue

      seen.add(file)
      files.push(file)
      const source = await host.read(file)
      if (host.hasLayerDeclaration(source)) return { found: true, files }
      queue.push({ css: source, importer: file })
    }
  }

  return { found: false, files }
}

export function cssImportSpecifiers(css: string): string[] {
  const specifiers: string[] = []
  let index = skipTrivia(css, 0)

  while (index < css.length && css[index] === '@') {
    const name = /^@([\w-]+)/.exec(css.slice(index, index + 32))?.[1]?.toLowerCase()
    if (name !== 'import' && name !== 'charset' && name !== 'layer') break

    const end = statementEnd(css, index + name.length + 1)
    if (css[end] !== ';' && end < css.length) break

    if (name === 'import') {
      const specifier = importSpecifier(css.slice(index + name.length + 1, end))
      if (specifier && !/^(?:[a-z][a-z\d+.-]+:|\/\/)/i.test(specifier)) specifiers.push(specifier)
    }
    index = skipTrivia(css, end + 1)
  }

  return specifiers
}

function skipTrivia(css: string, index: number) {
  while (index < css.length) {
    if (/\s/.test(css[index]!)) index++
    else if (css.startsWith('/*', index)) index = commentEnd(css, index)
    else break
  }
  return index
}

function commentEnd(css: string, index: number) {
  const end = css.indexOf('*/', index + 2)
  return end === -1 ? css.length : end + 2
}

function stringEnd(css: string, index: number) {
  const quote = css[index]
  for (let i = index + 1; i < css.length; i++) {
    if (css[i] === '\\') i++
    else if (css[i] === quote || css[i] === '\n') return i + 1
  }
  return css.length
}

function statementEnd(css: string, index: number) {
  let depth = 0
  while (index < css.length) {
    const char = css[index]!
    if (char === '"' || char === "'") index = stringEnd(css, index)
    else if (css.startsWith('/*', index)) index = commentEnd(css, index)
    else if (char === '\\') index += 2
    else {
      if (char === '(') depth++
      else if (char === ')') depth = Math.max(0, depth - 1)
      else if (depth === 0 && (char === ';' || char === '{' || char === '}')) return index
      index++
    }
  }
  return index
}

function importSpecifier(prelude: string) {
  const value = prelude.trim()
  const url = /^url\(\s*/i.exec(value)
  const rest = url ? value.slice(url[0].length) : value
  const quote = rest[0]
  if (quote === '"' || quote === "'") {
    return rest.slice(1, stringEnd(rest, 0) - 1).replace(/\\(.)/g, '$1')
  }
  return url ? /^[^)\s]+/.exec(rest)?.[0] : undefined
}
