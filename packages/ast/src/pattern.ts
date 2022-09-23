import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
//@ts-ignore
import generate from '@babel/generator'
import * as t from '@babel/types'
import { match, P } from 'ts-pattern'

const scope = {
  name: 'pattern',
  value: new Set(['name', 'transform', 'properties']),
}

export function extractPatterns(code: string) {
  const map = new Map<string, string>()

  const ast = parse(code, { sourceType: 'module' })

  traverse(ast, {
    ObjectExpression(path) {
      const result: any[] = []
      for (const property of path.node.properties) {
        match(property)
          .with(
            { type: 'ObjectProperty', key: { name: P.select('name') }, value: { value: P.select('value') } },
            (args) => {
              const { name, value } = args
              if (scope.value.has(name)) {
                result.push({ name, property, value })
              }
            },
          )
          .with({ type: 'ObjectMethod', key: { name: P.select() } }, (name) => {
            if (scope.value.has(name)) {
              result.push({ name, property })
            }
          })
          .otherwise(() => {
            //
          })
      }

      if (result.length >= 2) {
        const { value } = result.find((item) => item.name === 'name') ?? {}

        path.node.properties = path.node.properties.filter((property) => {
          return property.type === 'ObjectMethod'
        })

        const new_ast = t.program([
          t.variableDeclaration('const', [t.variableDeclarator(t.identifier(`${value}Fn`), path.node)]),
        ])

        map.set(value, generate(new_ast).code)
      }
    },
  })

  return map
}
