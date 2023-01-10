import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateReactJsxTypes(ctx: PandaContext) {
  const { name, componentName, upperName, typeName } = ctx.jsxFactoryDetails

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${name}: ${upperName}
    `,
    jsxType: outdent`
import type { ElementType, ComponentProps } from 'react'
import type { JsxStyleProps, Assign } from '.'

type Dict = Record<string, unknown>

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
  <T extends ElementType, P extends Dict = {}>(component: T): ${componentName}<T, P>
} & { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${typeName}<T extends ElementType> = Polyfill<ComponentProps<T>> & JsxStyleProps
  `,
  }
}
