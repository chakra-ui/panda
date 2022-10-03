import type * as swc from '@swc/core'
import { plugins, transformSync } from '@swc/core'
import Visitor from '@swc/core/Visitor'
import { isMatching, match, P } from 'ts-pattern'

const isTransformMethod = isMatching({
  type: 'MethodProperty',
  key: {
    type: 'Identifier',
    value: 'transform',
  },
})

const isValuesProperty = isMatching({
  type: P.union('MethodProperty', 'KeyValueProperty', 'ArrayExpression'),
  key: {
    type: 'Identifier',
    value: 'values',
  },
})

const OMITTED = [
  'tokens',
  'semanticTokens',
  'breakpoints',
  'keyframes',
  'conditions',
  'recipes',
  'patterns',
  'textStyles',
  'layerStyles',
  'include',
  'exclude',
]

function isOmitted(value: string) {
  return OMITTED.includes(value)
}

export class PurgeVisitor extends Visitor {
  visitObjectExpression(node: swc.ObjectExpression) {
    //
    const inner = (node: swc.ObjectExpression) => {
      // grab all keys of the object
      const keys = node.properties
        .filter((prop) => {
          return prop.type === 'KeyValueProperty' || prop.type === 'MethodProperty'
        })
        .map((prop: any) => prop.key.value)

      // object is an utility if it includes className
      const isUtility = keys.includes('className')

      // filter logic
      node.properties = node.properties.filter((property) => {
        if (isUtility && isTransformMethod(property)) {
          return false
        }

        if (isUtility && isValuesProperty(property)) {
          return false
        }

        if (property.type === 'Identifier' && isOmitted(property.value)) {
          return false
        }

        if (
          property.type === 'KeyValueProperty' &&
          property.key.type === 'Identifier' &&
          isOmitted(property.key.value)
        ) {
          return false
        }

        return true
      })

      // loop if needed
      node.properties.forEach((property) => {
        match(property)
          .with({ type: 'KeyValueProperty', value: { type: 'ObjectExpression' } }, (property) => {
            inner(property.value)
          })
          .with({ type: 'KeyValueProperty', value: { type: 'ArrayExpression' } }, (property) => {
            property.value.elements.forEach((item) => {
              if (item?.expression.type === 'ObjectExpression') {
                inner(item.expression)
              }
            })
          })
          .otherwise(() => {
            //
          })
      })
    }

    inner(node)

    return node
  }
}

function purgePlugin(program: swc.Program) {
  const visitor = new PurgeVisitor()
  return visitor.visitProgram(program)
}

export function minifyConfig(input: string, { minify }: { minify?: boolean } = {}) {
  const { code } = transformSync(input, {
    plugin: plugins([purgePlugin]),
    minify,
    jsc: {
      target: 'es2022',
      minify: {
        compress: true,
      },
    },
  })
  return code
}
