import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxTypes(ctx: PandaContext) {
  const { name, componentName, upperName, typeName } = ctx.jsxFactoryDetails

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${name}: ${upperName}
    `,
    jsxType: outdent`
import { JSX, ComponentProps, Component } from 'solid-js'
import { JsxStyleProps, Assign } from '.'
import { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

type AdditionalHtmlProps = {
  htmlSize?: string | number
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: 'yes' | 'no' | undefined
}

type Polyfill<T> = Omit<T, 'color' | 'translate' | 'transition' | 'width' | 'height' | 'size'> & AdditionalHtmlProps

type Props<T extends Dict, P extends Dict = {}> = Assign<Polyfill<T>, P>

export type ${componentName}<T extends ElementType, P extends Dict = {}> = {
  (props: Props<ComponentProps<T>, P> & JsxStyleProps): JSX.Element
  displayName?: string
}

export type ${upperName} = {
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe?: RecipeDefinition<P> | RecipeRuntimeFn<P>): ${componentName}<T, RecipeSelection<P>>
} & { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${typeName}<T extends ElementType> = Polyfill<ComponentProps<T>> & JsxStyleProps
  `,
  }
}
