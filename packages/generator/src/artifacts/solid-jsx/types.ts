import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import type { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { JSX, ComponentProps, Component } from 'solid-js'
import type { JsxStyleProps, JsxHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeRuntimeFn, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

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
