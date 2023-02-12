import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, JsxHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeRuntimeFn, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

export type PandaComponent<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, P> & JsxStyleProps): JSX.Element
  displayName?: string
}

export type Panda = {
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe?: RecipeDefinition<P> | RecipeRuntimeFn<P>): PandaComponent<T, RecipeSelection<P>>
} & { [K in keyof JSX.IntrinsicElements]: PandaComponent<K, {}> }

export type HTMLPandaProps<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>