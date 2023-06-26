import camelcase from 'camelcase-css'
import type { AtRule, Container } from 'postcss'

const UNITLESS = {
  aspectRatio: true,
  boxFlex: true,
  boxFlexGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  fontWeight: true,
  lineClamp: true,
  WebkitLineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true,
}

function atRule(node: AtRule) {
  if (typeof node.nodes === 'undefined') {
    return true
  } else {
    return objectify(node)
  }
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
        name = camelcase(child.prop)
      }
      let value = child.value as string | number
      if (!isNaN(Number(value)) && UNITLESS[name as keyof typeof UNITLESS]) {
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
