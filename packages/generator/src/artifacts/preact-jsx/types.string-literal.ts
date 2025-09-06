import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

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

export interface AsProps {
  /**
   * The element to render as
   */
  as?: ElementType | undefined
}

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T> & AsProps) => JSX.Element
  displayName?: string | undefined
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
