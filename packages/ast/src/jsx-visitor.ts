import { logger } from '@css-panda/logger'
import type { PluginResult } from '@css-panda/types'
import type * as AST from '@swc/core'
import Visitor from '@swc/core/Visitor'
import merge from 'lodash.merge'
import { match, P } from 'ts-pattern'
import * as ast from './ast'
import type { ImportResult } from './types'

export type JsxNode = {
  name: string
  props?: string[]
}

export type JsxVisitorOptions = {
  fileName?: string
  nodes: JsxNode[]
  factory: string
  module: string
  onData: (result: PluginResult) => void
  isStyleProp: (prop: string) => boolean
}

export class JSXVisitor extends Visitor {
  constructor(private ctx: JsxVisitorOptions) {
    super()
  }

  visitTsType(t: any) {
    return t
  }

  import: ImportResult[] | undefined

  visitImportDeclaration(node: AST.ImportDeclaration): AST.ImportDeclaration {
    const nodes = this.ctx.nodes.concat({ name: this.ctx.factory })
    const result = ast.importDeclaration(node, {
      module: this.ctx.module,
      name: nodes.map((node) => node.name),
    })

    if (result?.length) {
      logger.debug({
        type: 'ast:import',
        msg: `Found import { ${result.map(({ identifer }) => identifer).join(',')} } in ${this.ctx.fileName}`,
      })
      this.import = result
    }

    return node
  }

  getJsxName(node: AST.JSXElementName) {
    if (!this.import?.length) return
    return (
      match(node)
        // <panda.div/>
        .with({ object: { type: 'Identifier', value: P.select() } }, (value) => {
          return this.import!.find((item) => item.alias === value)?.alias
        })
        // <Box />
        .with({ type: 'Identifier', value: P.select() }, (value) => {
          return this.import!.find((item) => item.alias === value)?.alias
        })
        .otherwise(() => undefined)
    )
  }

  visitJSXOpeningElement(node: AST.JSXOpeningElement) {
    // TODO: read the css prop from generic components
    // only if the nodename starts with a capital letter (e.g. <Box css={...} />)

    const jsxName = this.getJsxName(node.name)

    if (!jsxName) return node

    const isValidProp = (prop: string) => {
      const node = this.ctx.nodes.find((node) => node.name === jsxName)
      return this.ctx.isStyleProp(prop) || node?.props?.includes(prop)
    }

    const attrs = node.attributes.filter((attr) => {
      return match(attr)
        .with({ type: 'JSXAttribute', name: { type: 'Identifier' } }, (_node) => {
          return isValidProp(_node.name.value)
        })
        .otherwise(() => false)
    })

    const result: Record<string, any> = {}

    for (const attr of attrs) {
      if (attr.type === 'SpreadElement') continue
      merge(result, ast.jsxAttribute(attr))
    }

    const isPattern = this.ctx.factory !== jsxName

    if (isPattern || Object.keys(result).length > 0) {
      this.ctx.onData?.({
        type: isPattern ? 'pattern' : 'object',
        data: result,
        name: jsxName,
      })
    }

    return node
  }
}
