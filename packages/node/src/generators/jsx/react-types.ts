import { capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateReactJsxTypes(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = capitalize(name)

  return {
    jsxFactory: outdent`
import { PolymorphicComponents } from '../types/jsx'
export declare const ${name}: PolymorphicComponents
    `,
    jsxType: outdent`
import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, Assign } from '.'

type Element = keyof JSX.IntrinsicElements
type Dict<T = unknown> = Record<string, T>

type Clean<T> = Omit<T, 'color' | 'translate' | 'transition'>

type PolymorphicProps<
  ComponentProps extends Dict,
  AdditionalProps extends Dict = {},
> = Assign<Clean<ComponentProps>, AdditionalProps>

export type PolymorphicComponent<C extends ElementType, P extends Dict = {}> = {
  (props: PolymorphicProps<ComponentProps<C>, P> & JsxStyleProps<P>): JSX.Element
  displayName?: string
}

export type PolymorphicComponents = {
  [K in Element]: PolymorphicComponent<K, {}>
}

export type HTML${upperName}Props<T extends ElementType> = Clean<ComponentProps<T>> & JsxStyleProps
  `,
  }
}
