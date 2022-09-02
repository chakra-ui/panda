import * as swc from '@swc/core'
import merge from 'lodash/merge'
import { match, P } from 'ts-pattern'
import { ImportResult } from './types'

export function keyValue(node: swc.KeyValueProperty, result: Record<string, any> = {}) {
  const key = match(node.key)
    .with({ type: P.union('Identifier', 'StringLiteral', 'NumericLiteral') }, (node) => node.value)
    .otherwise(() => {
      console.log(`unexpected key: ${node.key.type}`)
      return
    })

  if (!key) return result

  match(node.value)
    .with({ type: P.union('StringLiteral', 'NumericLiteral') }, (node) => {
      result[key] = node.value
    })
    .with({ type: 'ObjectExpression' }, (node) => {
      merge(result, { [key]: objectExpression(node) })
    })
    .with({ type: 'ArrayExpression' }, (node) => {
      merge(result, { [key]: arrayExpression(node) })
    })
    .with({ type: 'ConditionalExpression' }, (node) => {
      const values = expression(node.consequent).concat(expression(node.alternate)).flat()

      result.conditions ||= []
      result.conditions.push({ [key]: values })
    })
    .run()

  return result
}

export function arrayExpression(node: swc.ArrayExpression, result: Array<string | number> = []) {
  const len = node.elements.length

  for (let i = 0; i < len; i++) {
    const element = node.elements[i]
    if (!element) continue
    const expr = element.expression

    match(expr)
      .with({ type: P.union('StringLiteral', 'NumericLiteral') }, (node) => {
        result.push(node.value)
      })
      .run()
  }

  return result
}

export function objectExpression(node: swc.ObjectExpression) {
  const result: Record<string, any> = {}
  const { properties } = node
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    if (property.type == 'KeyValueProperty') {
      merge(result, keyValue(property))
    }
  }
  return result
}

export function expression(node: swc.Expression) {
  const result: any[] = []

  match(node)
    .with({ type: 'ArrayExpression' }, (node) => {
      result.push(arrayExpression(node))
    })
    .with({ type: 'ObjectExpression' }, (node) => {
      result.push(objectExpression(node))
    })
    .with({ type: P.union('StringLiteral', 'NumericLiteral') }, (node) => {
      result.push(node.value)
    })
    .run()

  return result
}

export function jsxAttribute(node: swc.JSXAttribute, result: Record<string, any> = {}) {
  const key = match(node.name)
    .with({ type: 'Identifier', value: P.select() }, (node) => node)
    .otherwise(() => undefined)

  if (!key) return result

  match(node.value)
    .with({ type: P.union('StringLiteral', 'NumericLiteral') }, (node) => {
      result[key] = node.value
    })
    .with(
      {
        type: 'JSXExpressionContainer',
        expression: { type: 'ObjectExpression' },
      },
      (node) => {
        merge(result, { [key]: objectExpression(node.expression) })
      },
    )
    .with(
      {
        type: 'JSXExpressionContainer',
        expression: { type: 'ArrayExpression' },
      },
      (node) => {
        merge(result, { [key]: arrayExpression(node.expression) })
      },
    )
    .with(
      {
        type: 'JSXExpressionContainer',
        expression: { type: 'ConditionalExpression' },
      },
      (node) => {
        result.conditions ||= []
        const consequent = expression(node.expression.consequent)
        const alternate = expression(node.expression.alternate)

        if (consequent.length) {
          result.conditions.push({ [key]: consequent[0] })
        }

        if (alternate.length) {
          result.conditions.push({ [key]: alternate[0] })
        }
      },
    )
    .run()

  return result
}

export function callExpression(node: swc.CallExpression, scope: string) {
  const result: swc.CallExpression[] = []

  const inner = (node: swc.CallExpression) => {
    if (node.callee.type === 'MemberExpression' || node.callee.type === 'Identifier') {
      if (node.callee.type === 'Identifier' && node.callee.value === scope) {
        result.push(node)
      } else {
        node.arguments.forEach((arg) => {
          if (arg.expression.type === 'CallExpression') {
            inner(arg.expression)
          }
        })
      }
    }
  }

  inner(node)
  return result[0]
}

export function importDeclaration(node: swc.ImportDeclaration, options: { module: string; name: string }) {
  const { specifiers, source } = node

  const result: ImportResult[] = []

  if (!source.value.includes(options.module)) return

  for (let i = 0; i < specifiers.length; i++) {
    match(specifiers[i])
      .with(
        {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', value: P.select() },
          imported: P.nullish,
        },
        (value) => {
          result.push({ identifer: value, alias: value })
        },
      )
      .with(
        {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', value: P.select('alias') },
          imported: { type: 'Identifier', value: P.select('main') },
        },
        ({ main, alias }) => {
          result.push({ identifer: main, alias: alias })
        },
      )
      .otherwise(() => {
        // noop
      })
  }

  return result.find((item) => item.identifer === options.name)
}

export function importDeclarations(node: swc.ImportDeclaration, module: string) {
  const { specifiers, source } = node

  const result: ImportResult[] = []
  const regex = new RegExp(module)
  if (!regex.test(source.value)) return

  for (let i = 0; i < specifiers.length; i++) {
    match(specifiers[i])
      .with(
        {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', value: P.select() },
          imported: P.nullish,
        },
        (value) => {
          result.push({ identifer: value, alias: value })
        },
      )
      .with(
        {
          type: 'ImportSpecifier',
          local: { type: 'Identifier', value: P.select('alias') },
          imported: { type: 'Identifier', value: P.select('main') },
        },
        ({ main, alias }) => {
          result.push({ identifer: main, alias: alias })
        },
      )
      .otherwise(() => {
        // noop
      })
  }

  return result
}
