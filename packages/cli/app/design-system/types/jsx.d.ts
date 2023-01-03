import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, Assign } from '.'

type Element = keyof JSX.IntrinsicElements
type As<P = any> = ElementType<P>
type Dict<T = unknown> = Record<string, T>

type Clean<T> = Omit<T, 'transition' | 'as' | 'color'>

type PolymorphicProps<
  ComponentProps extends Dict,
  AsProps extends Dict,
  AdditionalProps extends Dict = {},
  AsComponent extends As = As,
> = Assign<Clean<ComponentProps>, AdditionalProps> &
  Assign<Clean<AsProps>, AdditionalProps> & {
    as?: AsComponent
  }

export type PolymorphicComponent<C extends As, P extends Dict = {}> = {
  <E extends As = C>(props: PolymorphicProps<ComponentProps<C>, ComponentProps<E>, P, E> & JsxStyleProps<P>): JSX.Element
  displayName?: string
}

export type PolymorphicComponents = {
  [K in Element]: PolymorphicComponent<K, {}>
}

export type HTMLPandaProps<T extends As> = Clean<ComponentProps<T>> & JsxStyleProps