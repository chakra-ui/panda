import type * as AST from '@swc/core'
import Visitor from '@swc/core/Visitor'
import merge from 'lodash.merge'
import * as ast from './ast'
import type { ImportResult, PluginContext } from './types'
import { match } from 'ts-pattern'
import { logger } from '@css-panda/logger'

export class JSXPropVisitor extends Visitor {
  constructor(private ctx: PluginContext & { isValidProp: (prop: string) => boolean }) {
    super()
  }

  visitTsType(t: any) {
    return t
  }

  import: ImportResult | undefined

  visitImportDeclaration(node: AST.ImportDeclaration): AST.ImportDeclaration {
    const result = ast.importDeclaration(node, this.ctx.import)

    if (result) {
      logger.debug({
        type: 'ast:import',
        msg: `Found import { ${result.identifer} } in ${this.ctx.import.filename}`,
      })
      this.import = result
    }

    return node
  }

  visitJSXOpeningElement(node: AST.JSXOpeningElement) {
    if (!this.import) return node

    const isValidType = match(node.name)
      .with({ object: { type: 'Identifier', value: this.import.alias } }, () => true)
      .otherwise(() => false)

    if (!isValidType) return node

    const attrs = node.attributes.filter((attr) => {
      return match(attr)
        .with({ type: 'JSXAttribute', name: { type: 'Identifier' } }, (value) => {
          return this.ctx.isValidProp(value.name.value)
        })
        .otherwise(() => false)
    })

    const result: Record<string, any> = {}

    for (const attr of attrs) {
      if (attr.type === 'SpreadElement') continue
      merge(result, ast.jsxAttribute(attr))
    }

    this.ctx.onData?.({
      type: 'object',
      data: result,
    })

    return node
  }
}
