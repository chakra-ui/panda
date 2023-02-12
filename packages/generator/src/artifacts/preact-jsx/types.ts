import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import type { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { JSX, ComponentProps } from 'preact'
import type { JsxStyleProps, JsxHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeRuntimeFn, RecipeSelection, RecipeVariantRecord } from './recipe'

type ElementType = keyof JSX.IntrinsicElements

type Dict = Record<string, unknown>

export type ${componentName}<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, P> & JsxStyleProps): JSX.Element
  displayName?: string
}

export type ${upperName} = {
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe?: RecipeDefinition<P> | RecipeRuntimeFn<P>): ${componentName}<T, RecipeSelection<P>>
} & { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
