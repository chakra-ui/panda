import { isObject, walkObject } from '@pandacss/shared'
import type { AnimationStyleSpec, LayerStyleSpec, TextStyleSpec } from '@pandacss/types'

export const isBooleanValue = (value: string) => value === 'true' || value === 'false'

export const formatFunctionValue = (value: string): string => (isBooleanValue(value) ? value : `'${value}'`)
export const formatJsxValue = (value: string): string => (isBooleanValue(value) ? `{${value}}` : `"${value}"`)

export const buildFunctionProps = (key: string, value: string) => `${key}: ${formatFunctionValue(value)}`
export const buildJsxProps = (key: string, value: string) => `${key}=${formatJsxValue(value)}`

export interface FormatPropsOptions {
  keyValueSeparator?: string
  propSeparator?: string
  quoteStyle?: 'single' | 'double' | 'none'
}

export const formatProps = (props: Record<string, string | null | undefined>, options: FormatPropsOptions = {}) => {
  const { keyValueSeparator = ': ', propSeparator = ', ', quoteStyle = 'single' } = options
  const quote = quoteStyle === 'single' ? "'" : quoteStyle === 'double' ? '"' : ''
  return Object.entries(props)
    .filter(([_, value]) => value != null)
    .map(([key, value]) => `${key}${keyValueSeparator}${quote}${value}${quote}`)
    .join(propSeparator)
}

export const formatJsxComponent = (component: string, props: Record<string, string | null | undefined>) => {
  const formattedProps = formatProps(props, { keyValueSeparator: '=', propSeparator: ' ', quoteStyle: 'double' })
  return `<${component}${formattedProps ? ' ' + formattedProps : ''} />`
}

export const collectCompositionStyles = (
  values: Record<string, any>,
): Array<{ name: string; description?: string }> => {
  const result: Array<{ name: string; description?: string }> = []

  walkObject(
    values,
    (token, paths) => {
      if (token && isObject(token) && 'value' in token) {
        const filteredPaths = paths.filter((item) => item !== 'DEFAULT')
        result.push({
          name: filteredPaths.join('.'),
          description: token.description,
        })
      }
    },
    {
      stop: (v) => isObject(v) && 'value' in v,
    },
  )

  return result
}

export type JsxStyleProps = 'all' | 'minimal' | 'none'

/**
 * Generates a single JSX example based on jsxStyleProps setting
 */
export const generateJsxExample = (
  props: Record<string, string | null | undefined>,
  jsxStyleProps: JsxStyleProps = 'all',
  component = 'Box',
): string | null => {
  if (jsxStyleProps === 'all') {
    return formatJsxComponent(component, props)
  }
  if (jsxStyleProps === 'minimal') {
    return `<${component} css={{ ${formatProps(props)} }} />`
  }
  return null
}

/**
 * Generates function and JSX examples for a style property
 */
export const generateJsxExamples = (
  props: Record<string, string | null | undefined>,
  jsxStyleProps: JsxStyleProps = 'all',
  component = 'Box',
): { functionExamples: string[]; jsxExamples: string[] } => {
  const functionExamples = [`css({ ${formatProps(props)} })`]
  const jsxExamples: string[] = []

  const jsxExample = generateJsxExample(props, jsxStyleProps, component)
  if (jsxExample) {
    jsxExamples.push(jsxExample)
  }

  return { functionExamples, jsxExamples }
}

export type CompositionStyleType = 'text-styles' | 'layer-styles' | 'animation-styles'

const COMPOSITION_STYLE_CONFIG: Record<CompositionStyleType, { prop: string; themeKey: string }> = {
  'text-styles': { prop: 'textStyle', themeKey: 'textStyles' },
  'layer-styles': { prop: 'layerStyle', themeKey: 'layerStyles' },
  'animation-styles': { prop: 'animationStyle', themeKey: 'animationStyles' },
}

type CompositionStyleSpec<T extends CompositionStyleType> = T extends 'text-styles'
  ? TextStyleSpec
  : T extends 'layer-styles'
    ? LayerStyleSpec
    : AnimationStyleSpec

export function generateCompositionStyleSpec<T extends CompositionStyleType>(
  type: T,
  theme: Record<string, any> | undefined,
  jsxStyleProps?: JsxStyleProps,
): CompositionStyleSpec<T> {
  const { prop, themeKey } = COMPOSITION_STYLE_CONFIG[type]
  const styles = collectCompositionStyles(theme?.[themeKey] ?? {})

  const data = styles.map((style) => ({
    name: style.name,
    description: style.description,
    ...generateJsxExamples({ [prop]: style.name }, jsxStyleProps),
  }))

  return { type, data } as CompositionStyleSpec<T>
}
