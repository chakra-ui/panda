import type * as P from 'postcss'
import postcss from 'postcss'
import type { Config } from 'tailwindcss'
// @ts-expect-error Types added below
import { resolveMatches as resolveMatchesRaw } from 'tailwindcss/lib/lib/generateRules'
// @ts-expect-error Types added below
import { createContext as createContextRaw } from 'tailwindcss/lib/lib/setupContextUtils'
import type { TailwindContext, TailwindMatch } from './types'

const createContext = createContextRaw as (config: Config) => TailwindContext
const resolveMatches = resolveMatchesRaw as (candidate: string, context: TailwindContext) => Iterable<TailwindMatch>

const cssVarRegex = /var\((--([\w-]+))\)/

export const createTwParser = (config: Config) => {
  const context = createContext(config)

  const processClassName = (className: string, root: P.Root) => {
    const matches = Array.from(resolveMatches(className, context))
    matches.forEach((m) => {
      let [infos, rule] = m
      if (rule.type === 'decl') return

      let container: P.Container = root
      // console.log({
      //   type: rule.type,
      //   parent: rule.parent.type,
      //   nodes: rule.nodes?.length,
      //   css: rule.toString(),
      //   json: rule.toJSON(),
      // });
      if (rule.type === 'atrule') {
        const atRule = postcss.atRule({ name: rule.name, params: rule.params })
        root.append(atRule)
        container = atRule
      }

      const varMap = new Map()
      if (infos.collectedFormats?.length) {
        let modifierRule: P.Rule | undefined
        infos.collectedFormats.reverse().forEach(({ format }) => {
          const next = postcss.rule({ selector: format })
          if (!modifierRule) {
            container.append(next)
          } else {
            modifierRule.append(next)
          }

          modifierRule = next
        })

        if (modifierRule) {
          container = modifierRule
        }
      }
      rule.walkDecls((decl) => {
        // console.log({
        //   decl: decl.toString(),
        //   prop: decl.prop.toString(),
        //   value: decl.value.toString(),
        //   startsWith: decl.prop.startsWith("--"),
        // });
        if (decl.prop.startsWith('--')) {
          varMap.set(decl.prop, decl)
        }

        const match = decl.value.match(cssVarRegex)
        if (match && varMap.has(match[1])) {
          const cssVarDecl = varMap.get(match[1])
          decl.value = decl.value.replace(cssVarRegex, cssVarDecl.value)
          cssVarDecl.remove()
        }

        container!.append(decl)
      })
    })
  }

  return (classList: Set<string>) => {
    const root = postcss.root()
    classList.forEach((name) => processClassName(name, root))
    return root
  }
}
