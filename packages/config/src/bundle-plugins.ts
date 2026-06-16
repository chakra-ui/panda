import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Replace `import.meta.url` in each bundled module with its source file URL, so
 * the resolved config sees the real path rather than the bundle output's.
 */
export function importMetaUrlPlugin() {
  return {
    name: 'panda-import-meta-url',
    transform(code: string, id: string) {
      if (!isAbsolute(id) || !code.includes('import.meta.url')) return

      const replacement = JSON.stringify(pathToFileURL(id).href)
      const patched = replaceImportMetaUrl(code, replacement)
      if (patched === code) return

      return { code: patched, map: null }
    },
  }
}

function replaceImportMetaUrl(code: string, replacement: string): string {
  const ast = parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  })
  const output = new MagicString(code)
  let changed = false

  simple(ast, {
    MemberExpression(node) {
      if (!isImportMetaUrl(node)) return

      output.overwrite(node.start, node.end, replacement)
      changed = true
    },
  })

  return changed ? output.toString() : code
}

type MemberExpressionNode = {
  type: 'MemberExpression'
  object: unknown
  property: unknown
  computed: boolean
  start: number
  end: number
}

function isImportMetaUrl(node: MemberExpressionNode): boolean {
  if (node.computed || !isIdentifier(node.property, 'url')) return false

  const object = node.object
  return isNode(object, 'MetaProperty') && isIdentifier(object.meta, 'import') && isIdentifier(object.property, 'meta')
}

function isIdentifier(value: unknown, name: string): value is { type: 'Identifier'; name: string } {
  return isNode(value, 'Identifier') && value.name === name
}

function isNode<T extends string>(value: unknown, type: T): value is { type: T } & Record<string, any> {
  return !!value && typeof value === 'object' && (value as { type?: unknown }).type === type
}
