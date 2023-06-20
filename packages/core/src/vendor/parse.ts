// Fork of post-css-js: https://github.com/postcss/postcss-js/blob/main/parser.js

import postcss, { Container, type Parser } from 'postcss'

const IMPORTANT = /\s*!important\s*$/i

const UNITLESS = {
  'aspect-ratio': true,
  'box-flex': true,
  'box-flex-group': true,
  'column-count': true,
  flex: true,
  'flex-grow': true,
  'flex-positive': true,
  'flex-shrink': true,
  'flex-negative': true,
  'font-weight': true,
  'line-clamp': true,
  'line-height': true,
  opacity: true,
  order: true,
  orphans: true,
  'tab-size': true,
  widows: true,
  'z-index': true,
  zoom: true,
  'fill-opacity': true,
  'stroke-dashoffset': true,
  'stroke-opacity': true,
  'stroke-width': true,
}

const dashifyWordRegex = /([A-Z])/g
const dashifySecondRegex = /^ms-/

function dashify(str: string) {
  return str.replace(dashifyWordRegex, '-$1').replace(dashifySecondRegex, '-ms-').toLowerCase()
}

function decl(parent: Container, name: string, value: any) {
  if (value === false || value == null) return
  const isCssVar = name.startsWith('--')

  if (!isCssVar) {
    name = dashify(name)
  }

  if (typeof value === 'number') {
    if (value === 0 || UNITLESS[name as keyof typeof UNITLESS] || isCssVar) {
      value = value.toString()
    } else {
      value = `${value}px`
    }
  }

  if (name === 'css-float') name = 'float'

  if (IMPORTANT.test(value)) {
    value = value.replace(IMPORTANT, '')
    parent.push(postcss.decl({ prop: name, value, important: true }))
  } else {
    parent.push(postcss.decl({ prop: name, value }))
  }
}

function atRule(parent: Container, parts: RegExpMatchArray | null, value: string) {
  if (!parts) return
  const node = postcss.atRule({ name: parts[1], params: parts[3] || '' })
  if (typeof value === 'object') {
    node.nodes = []
    parse(value, node)
  }
  parent.push(node)
}

function parse(obj: Record<string, any>, parent: Container) {
  let name, value, node
  for (name in obj) {
    value = obj[name]
    if (value === null || typeof value === 'undefined') {
      continue
    } else if (name[0] === '@') {
      const parts = name.match(/@(\S+)(\s+([\W\w]*)\s*)?/)
      if (Array.isArray(value)) {
        for (const i of value) {
          atRule(parent, parts, i)
        }
      } else {
        atRule(parent, parts, value)
      }
    } else if (Array.isArray(value)) {
      for (const i of value) {
        decl(parent, name, i)
      }
    } else if (typeof value === 'object') {
      node = postcss.rule({ selector: name })
      parse(value, node)
      parent.push(node)
    } else {
      decl(parent, name, value)
    }
  }
}

const postCssPlugin = (obj: Record<string, any>) => {
  const root = postcss.root()
  parse(obj, root)
  return root
}

const impl = postCssPlugin as Parser

export { impl as parser }
