import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, JsxHTMLProps, Assign } from './system-types'
import type { RecipeDefinition, RecipeRuntimeFn, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

export type StyledComponent<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
  displayName?: string
}

export type Styled = {
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe?: RecipeDefinition<P> | RecipeRuntimeFn<P>): StyledComponent<T, RecipeSelection<P>>
} & { [K in keyof JSX.IntrinsicElements]: StyledComponent<K, {}> }

export type HTMLStyledProps<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>