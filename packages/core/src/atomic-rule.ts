import {
  esc,
  filterBaseConditions,
  isImportant,
  normalizeStyleObject,
  toHash,
  walkObject,
  withoutImportant,
} from '@pandacss/shared'
import type { Dict } from '@pandacss/types'
import postcss, { Container } from 'postcss'
import { toCss } from './to-css'
import type { AtomicRuleContext } from './types'

export interface ProcessOptions {
  styles: Dict
}

const urlRegex = /^https?:\/\//

interface WriteOptions {
  layer: string | undefined
  rule: Container
}

export class AtomicRule {
  constructor(private context: AtomicRuleContext, private fn: (opts: WriteOptions) => void) {}

  hashFn = (conditions: string[], className: string) => {
    const { conditions: cond, hash, utility } = this.context
    let result: string
    if (hash) {
      const baseArray = [...cond.finalize(conditions), className]
      result = utility.formatClassName(toHash(baseArray.join(':')))
    } else {
      const baseArray = [...cond.finalize(conditions), utility.formatClassName(className)]
      result = baseArray.join(':')
    }
    return esc(result)
  }

  get rule() {
    return this.context.conditions.rule()
  }

  get transform() {
    return this.context?.transform ?? this.context.utility.transform
  }

  normalize = (styles: Dict, normalizeShorthand = true) => {
    return normalizeStyleObject(styles, this.context, normalizeShorthand) as Dict
  }

  process = (options: ProcessOptions) => {
    const { styles: styleObject } = options
    const { conditions: cond } = this.context

    // shouldn't happen, but just in case
    if (typeof styleObject !== 'object') return

    const rule = this.rule

    walkObject(styleObject, (value, paths) => {
      // if value doesn't exist
      if (value == null) return

      // we don't want to extract and generate invalid CSS for urls
      if (urlRegex.test(value)) {
        return
      }

      const important = isImportant(value)

      // conditions.shift was done to support condition groups
      const [prop, ...allConditions] = cond.shift(paths)

      // remove default condition
      const conditions = filterBaseConditions(allConditions)

      // allow users transform the generated class and styles
      const transformed = this.transform(prop, withoutImportant(value))

      // convert css-in-js to css rule
      const cssRoot = toCss(transformed.styles, { important })

      rule.nodes = cssRoot.root.nodes as postcss.ChildNode[]

      // no empty rulesets
      if (rule.isEmpty) return

      const selector = this.hashFn(conditions, transformed.className)

      rule.selector = important ? `.${selector}\\!` : `.${selector}`

      rule.update()

      // apply css conditions
      rule.applyConditions(conditions)

      const styleRule = rule.rule!

      this.fn({ layer: transformed.layer, rule: styleRule })
    })
  }
}

export function createRecipeAtomicRule(ctx: AtomicRuleContext, slot?: boolean) {
  return new AtomicRule(ctx, ({ rule, layer }) => {
    if (layer === '_base' && slot) {
      ctx.layers.slotRecipes.base.append(rule)
    } else if (slot) {
      ctx.layers.slotRecipes.root.append(rule)
    } else if (layer === '_base') {
      ctx.layers.recipes.base.append(rule)
    } else {
      ctx.layers.recipes.root.append(rule)
    }
  })
}

export function createAtomicRule(ctx: AtomicRuleContext) {
  return new AtomicRule(ctx, ({ layer, rule }) => {
    if (layer === 'composition') {
      ctx.layers.utilities.compositions.append(rule)
    } else if (typeof layer === 'string') {
      ctx.layers.utilities.custom(layer).append(rule)
    } else {
      ctx.layers.utilities.root.append(rule)
    }
  })
}
