/**
 * Inlined postcss-merge-rules plugin.
 * Original: https://github.com/cssnano/cssnano/tree/main/packages/postcss-merge-rules
 *
 * We inline this to avoid dependencies on browserslist, caniuse-api, and cssnano-utils
 * which can cause warnings (e.g. baseline-browser-mapping) and affect CSS output stability.
 *
 * Compatibility checks are simplified: we always allow merging since Panda targets modern browsers.
 */

import type { AtRule, Declaration, Rule } from 'postcss'

const vendorPrefix = /-(ah|apple|atsc|epub|hp|khtml|moz|ms|o|rim|ro|tc|wap|webkit|xv)-/

const findMsInputPlaceholder = (selector: string) => ~selector.search(/-ms-input-placeholder/i)

function filterPrefixes(selector: string): RegExpMatchArray | null {
  return selector.match(vendorPrefix)
}

function sameVendor(selectorsA: string[], selectorsB: string[]): boolean {
  const same = (selectors: string[]) => selectors.map((s) => filterPrefixes(s)?.join() ?? '').join(',')
  const findMsVendor = (selectors: string[]) => selectors.find((s) => findMsInputPlaceholder(s))
  return same(selectorsA) === same(selectorsB) && !(findMsVendor(selectorsA) && findMsVendor(selectorsB))
}

function noVendor(selector: string): boolean {
  return !vendorPrefix.test(selector)
}

function checkMatch(
  nodeA: { type: string; params?: string; name?: string },
  nodeB: { type: string; params?: string; name?: string },
): boolean {
  if (nodeA.type === 'atrule' && nodeB.type === 'atrule') {
    return nodeA.params === nodeB.params && nodeA.name?.toLowerCase() === nodeB.name?.toLowerCase()
  }
  return nodeA.type === nodeB.type
}

type ChildNode = { parent?: ChildNode }

function sameParent(nodeA: ChildNode, nodeB: ChildNode): boolean {
  if (!nodeA.parent) {
    return !nodeB.parent
  }
  if (!nodeB.parent) {
    return false
  }
  if (!checkMatch(nodeA.parent as any, nodeB.parent as any)) {
    return false
  }
  return sameParent(nodeA.parent, nodeB.parent)
}

function declarationIsEqual(a: Declaration, b: Declaration): boolean {
  return a.important === b.important && a.prop === b.prop && a.value === b.value
}

function indexOfDeclaration(array: Declaration[], decl: Declaration): number {
  return array.findIndex((d) => declarationIsEqual(d, decl))
}

function intersect(a: Declaration[], b: Declaration[], not = false): Declaration[] {
  return a.filter((c) => {
    const index = indexOfDeclaration(b, c) !== -1
    return not ? !index : index
  })
}

function sameDeclarationsAndOrder(a: Declaration[], b: Declaration[]): boolean {
  if (a.length !== b.length) return false
  return a.every((d, index) => declarationIsEqual(d, b[index]))
}

function isRuleOrAtRule(node: { type: string }): boolean {
  return node.type === 'rule' || node.type === 'atrule'
}

function isDeclaration(node: { type: string }): node is Declaration {
  return node.type === 'decl'
}

function getDecls(rule: Rule): Declaration[] {
  return rule.nodes.filter(isDeclaration) as Declaration[]
}

const joinSelectors = (...rules: Rule[]) => rules.map((s) => s.selector).join(',')

function ruleLength(...rules: Rule[]): number {
  return rules.map((r) => (r.nodes.length ? String(r) : '')).join('').length
}

function splitProp(prop: string): {
  prefix: string | null
  base: string | null
  rest: string[]
} {
  const parts = prop.split('-')
  if (prop[0] !== '-') {
    return { prefix: '', base: parts[0], rest: parts.slice(1) }
  }
  if (prop[1] === '-') {
    return { prefix: null, base: null, rest: [prop] }
  }
  return {
    prefix: parts[1],
    base: parts[2],
    rest: parts.slice(3),
  }
}

function isConflictingProp(propA: string, propB: string): boolean {
  if (propA === propB) return true
  const a = splitProp(propA)
  const b = splitProp(propB)
  if (!a.base && !b.base) return true
  if (a.base !== b.base && a.base !== 'place' && b.base !== 'place') {
    return false
  }
  if (a.rest.length !== b.rest.length) return true
  if (a.base === 'border') {
    const allRestProps = new Set([...a.rest, ...b.rest])
    if (
      allRestProps.has('image') ||
      allRestProps.has('width') ||
      allRestProps.has('color') ||
      allRestProps.has('style')
    ) {
      return true
    }
  }
  return a.rest.every((s, index) => b.rest[index] === s)
}

function mergeParents(first: Rule, second: Rule): boolean {
  if (!first.parent || !second.parent) return false
  if (first.parent === second.parent) return false
  second.remove()
  first.parent.append(second)
  return true
}

function canMerge(ruleA: Rule, ruleB: Rule): boolean {
  const a = ruleA.selectors
  const b = ruleB.selectors
  const selectors = a.concat(b)

  const parent = sameParent(ruleA as any, ruleB as any)
  if (
    parent &&
    ruleA.parent &&
    ruleA.parent.type === 'atrule' &&
    (ruleA.parent as AtRule).name?.includes('keyframes')
  ) {
    return false
  }
  if (ruleA.some(isRuleOrAtRule) || ruleB.some(isRuleOrAtRule)) {
    return false
  }
  return parent && (selectors.every(noVendor) || sameVendor(a, b))
}

function partialMerge(first: Rule, second: Rule): Rule {
  let intersection = intersect(getDecls(first), getDecls(second))
  if (intersection.length === 0) return second

  let nextRule = second.next()
  if (!nextRule) {
    const parentSibling = (second.parent as any)?.next()
    nextRule = parentSibling?.nodes?.[0]
  }

  if (nextRule && nextRule.type === 'rule' && canMerge(second, nextRule)) {
    const nextIntersection = intersect(getDecls(second), getDecls(nextRule))
    if (nextIntersection.length > intersection.length) {
      mergeParents(second, nextRule)
      first = second
      second = nextRule
      intersection = nextIntersection
    }
  }

  const firstDecls = getDecls(first)
  intersection = intersection.filter((decl, intersectIndex) => {
    const indexOfDecl = indexOfDeclaration(firstDecls, decl)
    const nextConflictInFirst = firstDecls.slice(indexOfDecl + 1).filter((d) => isConflictingProp(d.prop, decl.prop))
    if (nextConflictInFirst.length === 0) return true
    const nextConflictInIntersection = intersection
      .slice(intersectIndex + 1)
      .filter((d) => isConflictingProp(d.prop, decl.prop))
    if (nextConflictInFirst.length !== nextConflictInIntersection.length) {
      return false
    }
    return nextConflictInFirst.every((d, index) => declarationIsEqual(d, nextConflictInIntersection[index]))
  })

  const secondDecls = getDecls(second)
  intersection = intersection.filter((decl) => {
    const nextConflictIndex = secondDecls.findIndex((d) => isConflictingProp(d.prop, decl.prop))
    if (nextConflictIndex === -1) return false
    if (!declarationIsEqual(secondDecls[nextConflictIndex], decl)) {
      return false
    }
    if (
      decl.prop.toLowerCase() !== 'direction' &&
      decl.prop.toLowerCase() !== 'unicode-bidi' &&
      secondDecls.some((d) => d.prop.toLowerCase() === 'all')
    ) {
      return false
    }
    secondDecls.splice(nextConflictIndex, 1)
    return true
  })

  if (intersection.length === 0) return second

  const receivingBlock = second.clone()
  receivingBlock.selector = joinSelectors(first, second)
  receivingBlock.nodes = []
  ;(second.parent as any).insertBefore(second, receivingBlock)

  const firstClone = first.clone()
  const secondClone = second.clone()

  function moveDecl(callback: (decl: Declaration) => void) {
    return (decl: Declaration) => {
      if (indexOfDeclaration(intersection, decl) !== -1) {
        callback(decl)
      }
    }
  }

  firstClone.walkDecls(
    moveDecl((decl) => {
      decl.remove()
      receivingBlock.append(decl)
    }),
  )
  secondClone.walkDecls(moveDecl((decl) => decl.remove()))

  const merged = ruleLength(firstClone, receivingBlock, secondClone)
  const original = ruleLength(first, second)

  if (merged < original) {
    first.replaceWith(firstClone)
    second.replaceWith(secondClone)
    ;[firstClone, receivingBlock, secondClone].forEach((r) => {
      if (r.nodes.length === 0) r.remove()
    })
    if (!secondClone.parent) return receivingBlock
    return secondClone
  } else {
    receivingBlock.remove()
    return second
  }
}

function selectorMerger() {
  let cache: Rule | null = null
  return function (rule: Rule) {
    if (!cache || !canMerge(rule, cache)) {
      cache = rule
      return
    }
    if (cache === rule) {
      cache = rule
      return
    }
    mergeParents(cache, rule)
    if (sameDeclarationsAndOrder(getDecls(rule), getDecls(cache))) {
      rule.selector = joinSelectors(cache, rule)
      cache.remove()
      cache = rule
      return
    }
    if (cache.selector === rule.selector) {
      const cached = getDecls(cache)
      rule.walk((node) => {
        if (node.type === 'decl' && indexOfDeclaration(cached, node) !== -1) {
          node.remove()
          return
        }
        cache!.append(node)
      })
      rule.remove()
      return
    }
    cache = partialMerge(cache, rule)
  }
}

export function mergeRules() {
  return {
    postcssPlugin: 'postcss-merge-rules',
    OnceExit(css: { walkRules: (fn: (rule: Rule) => void) => void }) {
      css.walkRules(selectorMerger())
    },
  }
}

mergeRules.postcss = true
