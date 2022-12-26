import { capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generatePreactJsxTypes(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = capitalize(name)

  return {
    jsxFactory: outdent`
import { PolymorphicComponents } from '../types/jsx'
export declare const ${name}: PolymorphicComponents
    `,
    jsxType: outdent`
import type { JSX, ComponentProps, ElementType } from 'preact'
import type { JsxStyleProps, Assign } from '.'

type Element = keyof JSX.IntrinsicElements
type As<P = any> = JSX.ElementType<P>
type Dict<T = unknown> = Record<string, T>

type Clean<T> = Omit<T, 'transition' | 'as' | 'color'>

type PolymorphicProps<
  ComponentProps extends Dict,
  AsProps extends Dict,
  AdditionalProps extends Dict = Dict,
  AsComponent extends As = As,
> = Assign<Clean<ComponentProps>, AdditionalProps> &
  Assign<Clean<AsProps>, AdditionalProps> & {
    as?: AsComponent
  }

export type PolymorphicComponent<C extends As, P extends Dict = Dict> = {
  <E extends As = C>(props: PolymorphicProps<ComponentProps<C>, ComponentProps<E>, P, E> & JsxStyleProps): JSX.Element
  displayName?: string
}

export type PolymorphicComponents = {
  [K in Element]: PolymorphicComponent<K, {}>
}

export type HTML${upperName}Props<T extends As> = Clean<ComponentProps<T>> & JsxStyleProps
  `,
  }
}
