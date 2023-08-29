import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import type { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentProps, JSX } from 'preact'
${ctx.file.importType('Assign, JsxStyleProps, JsxHTMLProps', './system-types')}
${ctx.file.importType('RecipeDefinition, RecipeSelection, RecipeVariantRecord', './recipe')}

type ElementType = keyof JSX.IntrinsicElements

type Dict = Record<string, unknown>

export type ${componentName}<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, P> & JsxStyleProps): JSX.Element
  displayName?: string
}

type RecipeFn = { __type: any }

interface JsxFactory {
  ${styleProps === 'none' ? '' : `<T extends ElementType>(component: T): ${componentName}<T, {}>`}
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
