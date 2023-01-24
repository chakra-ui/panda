import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxTypes(ctx: PandaContext) {
  const { name, componentName, upperName, typeName } = ctx.jsxFactoryDetails

  return {
    jsxFactory: outdent`
import type { ${upperName} } from '../types/jsx'
export declare const ${name}: ${upperName}
    `,
    jsxType: outdent`
import type { JSX, ComponentProps, Component } from 'solid-js'
import type { JsxStyleProps, Assign } from '.'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

type HTMLProps = {
  htmlSize?: string | number
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: 'yes' | 'no' | undefined
}

type Polyfill<T> = Omit<T, 'color' | 'translate' | 'transition' | 'width' | 'height' | 'size'> & HTMLProps

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
