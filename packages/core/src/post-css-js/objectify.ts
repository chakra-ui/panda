import { camelCaseProperty } from '@pandacss/shared'
import type { AtRule, Container } from 'postcss'
import { unitlessProperties } from '../unitless'

function atRule(node: AtRule) {
  if (typeof node.nodes === 'undefined') return true
  return objectify(node)
}

export function objectify(node: Container) {
  let name
  const result: Record<string, any> = {}

  node.each((child) => {
    if (child.type === 'atrule') {
      name = '@' + child.name
      if (child.params) name += ' ' + child.params
      if (typeof result[name] === 'undefined') {
        result[name] = atRule(child)
      } else if (Array.isArray(result[name])) {
        result[name].push(atRule(child))
      } else {
        result[name] = [result[name], atRule(child)]
      }
    } else if (child.type === 'rule') {
      const body = objectify(child)
      if (result[child.selector]) {
        for (const i in body) {
          result[child.selector][i] = body[i]
        }
      } else {
        result[child.selector] = body
      }
    } else if (child.type === 'decl') {
      if (child.prop[0] === '-' && child.prop[1] === '-') {
        name = child.prop
      } else {
        name = camelCaseProperty(child.prop)
      }
      let value = child.value as string | number
      if (!isNaN(Number(value)) && unitlessProperties.has(name)) {
        value = parseFloat(child.value)
      }
      if (child.important) value += ' !important'
      if (typeof result[name] === 'undefined') {
        result[name] = value
      } else if (Array.isArray(result[name])) {
        result[name].push(value)
      } else {
        result[name] = [result[name], value]
      }
    }
  })

  return result
}
