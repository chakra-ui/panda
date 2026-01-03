declare module 'virtual:*' {
  export const config: import('@pandacss/types').UserConfig
  export const textStyles: Record<string, string>
  export const layerStyles: Record<string, string>
  export const themes: Record<string, any>
}
