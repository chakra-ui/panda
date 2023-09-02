import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentProps, JSX } from 'preact'

type ElementType = keyof JSX.IntrinsicElements

type Dict = Record<string, unknown>

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
