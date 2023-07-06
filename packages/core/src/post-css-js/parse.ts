// Fork of post-css-js: https://github.com/postcss/postcss-js/blob/main/parser.js

import { hypenateProperty } from '@pandacss/shared'
import postcss, { Container, type Parser } from 'postcss'
import { unitlessProperties } from '../unitless'

const IMPORTANT = /\s*!important\s*$/i

function decl(parent: Container, name: string, value: any) {
  if (value === false || value == null) return
  const isCssVar = name.startsWith('--')

  if (!isCssVar) {
    name = hypenateProperty(name)
  }

  if (typeof value === 'number') {
    if (value === 0 || unitlessProperties.has(name) || isCssVar) {
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

const AT_RULE = /@(\S+)(\s+([\W\w]*)\s*)?/

function parse(obj: Record<string, any>, parent: Container) {
  let name, value, node
  for (name in obj) {
    value = obj[name]
    if (value === null || typeof value === 'undefined') {
      continue
    } else if (name[0] === '@') {
      const parts = name.match(AT_RULE)
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

export const parser = postCssPlugin as Parser
