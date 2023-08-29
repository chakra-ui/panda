import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, ComponentProps, JSX } from 'solid-js'

type Dict = Record<string, unknown>

type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

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
