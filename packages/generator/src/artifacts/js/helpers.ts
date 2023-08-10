import { outdent } from 'outdent'
import helpersMjs from '../generated/helpers.mjs.json' assert { type: 'json' }
import escMjs from '../generated/esc.mjs.json' assert { type: 'json' }
import astishMjs from '../generated/astish.mjs.json' assert { type: 'json' }
import normalizeHtmlMjs from '../generated/normalize-html.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'

export function generateHelpers(ctx: Context) {
  return {
    js: outdent`
  ${ctx.config.missingCssWarning ? prependHelpersWithMissingCssWarningFn(helpersMjs.content) : helpersMjs.content}
  ${ctx.isTemplateLiteralSyntax ? astishMjs.content : ''}

  ${ctx.jsx.framework ? `${normalizeHtmlMjs.content}` : ''}

  export function __spreadValues(a, b) {
    return { ...a, ...b }
  }

  export function __objRest(source, exclude) {
    return Object.fromEntries(Object.entries(source).filter(([key]) => !exclude.includes(key)))
  }
  `,
  }
}

const prependHelpersWithMissingCssWarningFn = (helpers: string) => {
  return (
    helpers.replace('classNames.add(className)', 'classNames.add(className);\nisInCss(className)') +
    outdent`
    ${escMjs.content}

    const isCssStyleRule = (rule) => rule instanceof CSSStyleRule
    const isGroupingRule = (rule) => 'cssRules' in rule

    function traverseCSSRule(rule, className) {
      const stack = []
      stack.push(rule)

      while (stack.length > 0) {
        const currentRule = stack.pop()
        if (!currentRule) continue

        if (isCssStyleRule(currentRule)) {
          const selectorText = currentRule.selectorText
          if (selectorText && selectorText.includes(className)) {
            return currentRule
          }
        }

        if (isGroupingRule(currentRule) && currentRule.cssRules) {
          stack.push(...Array.from(currentRule.cssRules))
        }
      }
    }


    const missingRules = new Set()
    const isInCss = (className) => {
      if (typeof window === 'undefined') return
      const escaped = '.' + esc(className)
      const styleSheets = document.styleSheets
      for (const styleSheet of styleSheets) {
        const rules = styleSheet.cssRules || styleSheet.rules
        if (!rules) continue

        for (const rule of rules) {
          const match = traverseCSSRule(rule, escaped)
          if (match) return match
        }
      }

      if (missingRules.has(className)) return
      missingRules.add(className)
      console.log(\`No matching CSS rule found for <\${className}>\`)
    }
    `
  )
}
