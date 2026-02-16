import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import type { JsxAttribute, JsxElement, JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { resolveJsxStylesToClassNames, resolvePatternToClassNames, buildDomClassNames } from './resolver'

type JsxElementNode = JsxOpeningElement | JsxSelfClosingElement

/**
 * Inline JSX style props for items in parserResult.jsx (type 'jsx' and 'jsx-factory').
 *
 * <styled.button color="red.300"> → <button className="c_red.300">
 * <Box mt="4" /> → <div className="mt_4" />
 */
export function inlineJsxStyleProps(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const node = asJsxElementNode(item.box.getNode())
  if (!node) return false

  // Determine HTML tag
  let htmlTag = 'div'
  if (item.type === 'jsx-factory' && item.name) {
    // styled.div → 'div', styled.button → 'button'
    const parts = item.name.split('.')
    htmlTag = parts[parts.length - 1] || 'div'
  }

  // Resolve style props to className
  const className = resolveJsxStylesToClassNames(ctx, item.data)

  // Collect style prop names from extracted data
  const stylePropNames = collectPropNames(item.data)

  return replaceJsxElement(ms, node, htmlTag, className, stylePropNames)
}

/**
 * Inline JSX pattern elements (e.g. <HStack gap="4">).
 * Handles items from parserResult.pattern with type 'jsx-pattern'.
 */
export function inlineJsxPattern(ms: MagicString, item: ResultItem, patternName: string, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false
  if (item.type !== 'jsx-pattern') return false

  const node = asJsxElementNode(item.box.getNode())
  if (!node) return false

  // Resolve pattern name from JSX component name
  const fnName = item.name ? ctx.patterns.find(item.name) : patternName
  if (!fnName) return false

  const className = resolvePatternToClassNames(ctx, fnName, item.data)
  if (!className) return false

  const stylePropNames = collectPropNames(item.data)

  return replaceJsxElement(ms, node, 'div', className, stylePropNames)
}

/**
 * Inline JSX recipe elements (e.g. <Button size="lg">).
 * Handles items from parserResult.recipe with type 'jsx-recipe'.
 */
export function inlineJsxRecipe(ms: MagicString, item: ResultItem, recipeName: string, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false
  if (item.type !== 'jsx-recipe') return false

  // Skip slot recipes
  if (ctx.recipes.isSlotRecipe(recipeName)) return false

  const recipeNode = ctx.recipes.getRecipe(recipeName)
  const config = ctx.recipes.getConfig(recipeName)
  if (!recipeNode || !config) return false

  const node = asJsxElementNode(item.box.getNode())
  if (!node) return false

  const allProps = item.data[0] ?? {}
  const [recipeProps, styleProps] = ctx.recipes.splitProps(recipeName, allProps)

  // Generate recipe classNames (base + variants)
  const computedVariants = Object.assign({}, config.defaultVariants, recipeProps)
  const classNames: string[] = [recipeNode.className]
  const separator = ctx.utility.separator ?? '_'

  for (const [variantKey, variantValue] of Object.entries(computedVariants)) {
    if (variantValue == null) continue
    const variants = config.variants?.[variantKey]
    if (!variants || !(String(variantValue) in variants)) continue
    classNames.push(`${recipeNode.className}--${variantKey}${separator}${variantValue}`)
  }

  // Generate atomic classNames from leftover style props
  if (Object.keys(styleProps).length > 0) {
    const atomicClassNames = resolveJsxStylesToClassNames(ctx, [styleProps])
    if (atomicClassNames) classNames.push(atomicClassNames)
  }

  // Handle compound variants
  if (config.compoundVariants) {
    for (const cv of config.compoundVariants) {
      if (!cv?.css) continue
      const matches = Object.entries(cv).every(([key, value]) => {
        if (key === 'css') return true
        return computedVariants[key] === value
      })
      if (matches) {
        const encoder = ctx.encoder.clone()
        encoder.processAtomic(cv.css)
        const atomicClasses = buildDomClassNames(encoder, ctx)
        if (atomicClasses) classNames.push(atomicClasses)
      }
    }
  }

  const className = classNames.join(' ')
  const stylePropNames = collectPropNames(item.data)

  return replaceJsxElement(ms, node, 'div', className, stylePropNames)
}

// ── Shared helpers ──────────────────────────────────────────────────────

/** Matches valid JSX tag names: identifiers (`Foo`) and member expressions (`Foo.Bar`) */
const jsxTagNameRegex = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/

function asJsxElementNode(node: Node): JsxElementNode | undefined {
  const kind = node.getKindName()
  if (kind === 'JsxOpeningElement' || kind === 'JsxSelfClosingElement') {
    return node as JsxElementNode
  }
  return undefined
}

function isSelfClosing(node: JsxElementNode): node is JsxSelfClosingElement {
  return node.getKindName() === 'JsxSelfClosingElement'
}

function collectPropNames(data: Array<Record<string, any>>): Set<string> {
  const names = new Set<string>()
  for (const obj of data) {
    for (const key of Object.keys(obj)) {
      names.add(key)
    }
  }
  return names
}

/**
 * Replace a JSX opening/self-closing element with a plain HTML tag + className.
 *
 * 1. Determines which attributes to keep (non-style, non-panda-specific)
 * 2. Merges existing className with resolved className
 * 3. Overwrites the opening tag
 * 4. If not self-closing, overwrites the closing tag
 */
function replaceJsxElement(
  ms: MagicString,
  node: JsxElementNode,
  htmlTag: string,
  className: string,
  stylePropNames: Set<string>,
): boolean {
  const attrs = node.getAttributes()

  // Bail on spread attributes — can't safely inline
  if (attrs.some((a) => a.getKindName() === 'JsxSpreadAttribute')) return false

  const keptAttrs: string[] = []
  let existingClassNameInit: string | null = null

  for (const attr of attrs) {
    if (attr.getKindName() === 'JsxSpreadAttribute') return false

    const jsxAttr = attr as JsxAttribute
    const name = jsxAttr.getNameNode().getText()

    // Check for 'as' prop and use its value as the HTML tag
    if (name === 'as') {
      const init = jsxAttr.getInitializer()
      if (init) {
        const text = init.getText()
        if (text.startsWith('"') || text.startsWith("'")) {
          htmlTag = text.slice(1, -1)
        } else if (text.startsWith('{')) {
          const expr = text.slice(1, -1).trim()
          if (jsxTagNameRegex.test(expr)) {
            htmlTag = expr
          } else {
            return false
          }
        }
      }
      continue
    }

    // Skip style props and css/*Css props
    if (stylePropNames.has(name) || name === 'css' || name.endsWith('Css')) {
      continue
    }

    // Capture existing className for merging
    if (name === 'className') {
      const init = jsxAttr.getInitializer()
      if (init) existingClassNameInit = init.getText()
      continue
    }

    keptAttrs.push(jsxAttr.getText())
  }

  // Build the className attribute
  const classAttr = buildClassNameAttr(className, existingClassNameInit)

  // Assemble the new tag
  const allAttrs = classAttr ? [classAttr, ...keptAttrs] : keptAttrs
  const propsStr = allAttrs.length > 0 ? ' ' + allAttrs.join(' ') : ''
  const selfClose = isSelfClosing(node)
  const closing = selfClose ? ' />' : '>'
  const newTag = `<${htmlTag}${propsStr}${closing}`

  ms.overwrite(node.getStart(), node.getEnd(), newTag)

  // Replace closing tag if not self-closing
  if (!selfClose) {
    const jsxElement = node.getParent() as JsxElement
    const closingElement = jsxElement.getClosingElement()
    if (closingElement) {
      ms.overwrite(closingElement.getStart(), closingElement.getEnd(), `</${htmlTag}>`)
    }
  }

  return true
}

function buildClassNameAttr(className: string, existingInit: string | null): string {
  if (!className && !existingInit) return ''

  if (!className && existingInit) {
    return `className=${existingInit}`
  }

  if (!existingInit) {
    return `className="${className}"`
  }

  // Merge with existing className
  if (existingInit.startsWith('"') || existingInit.startsWith("'")) {
    const quote = existingInit[0]
    const existing = existingInit.slice(1, -1)
    return `className=${quote}${existing} ${className}${quote}`
  }

  if (existingInit.startsWith('{')) {
    const expr = existingInit.slice(1, -1).trim()
    return `className={${expr} + " ${className}"}`
  }

  return `className="${className}"`
}
