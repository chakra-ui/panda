import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generatePreactJsxTypes(ctx: PandaContext) {
  const { name, componentName, upperName, typeName } = ctx.jsxFactoryDetails

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${name}: ${upperName}
    `,
    jsxType: outdent`
import type { JSX, ElementType, ComponentProps } from 'preact'
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

export type ${componentName}<ComponentType extends ElementType, AdditionalProps extends Dict = {}> = {
  (
    props: Props<ComponentProps<ComponentType>, AdditionalProps> & JsxStyleProps<AdditionalProps>,
  ): JSX.Element
  displayName?: string
}

export type ${upperName} = {
  <Component extends ElementType, AdditionalProps extends Dict = {}>(component: Component): ${componentName}<
    Component,
    AdditionalProps
  >
} & { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${typeName}<ComponentType extends ElementType> = Polyfill<ComponentProps<ComponentType>> & JsxStyleProps
  `,
  }
}
