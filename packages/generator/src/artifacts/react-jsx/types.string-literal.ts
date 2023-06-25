import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentProps, ElementType } from 'react'

type Dict = Record<string, unknown>

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K> }

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
