import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, Assign } from '.'

type Dict = Record<string, unknown>

type AdditionalHtmlProps = {
  htmlSize?: string | number
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: 'yes' | 'no' | undefined
}

type Polyfill<ComponentProps> = Omit<
  ComponentProps,
  'color' | 'translate' | 'transition' | 'width' | 'height' | 'size'
> &
  AdditionalHtmlProps

type Props<ComponentProps extends Dict, AdditionalProps extends Dict = {}> = Assign<
  Polyfill<ComponentProps>,
  AdditionalProps
>

export type PandaComponent<ComponentType extends ElementType, AdditionalProps extends Dict = {}> = {
  (
    props: Props<ComponentProps<ComponentType>, AdditionalProps> & JsxStyleProps,
  ): JSX.Element
  displayName?: string
}

export type Panda = {
  <Component extends ElementType, AdditionalProps extends Dict = {}>(component: Component): PandaComponent<
    Component,
    AdditionalProps
  >
} & { [K in keyof JSX.IntrinsicElements]: PandaComponent<K, {}> }

export type HTMLPandaProps<ComponentType extends ElementType> = Polyfill<ComponentProps<ComponentType>> & JsxStyleProps