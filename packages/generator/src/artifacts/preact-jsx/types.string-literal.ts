import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentProps, JSX } from 'preact'

export type ElementType = JSX.ElementType

interface Dict {
  [k: string]: unknown
}

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

export interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: ${componentName}<K>
}

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
