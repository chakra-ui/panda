/* eslint-disable */
declare const isCssProperty: (value: string) => boolean;
declare const splitCssProps: <TProps extends Record<string, unknown>>(props: TProps) => [Pick<TProps, CssProperty>, Omit<TProps, CssProperty>]

export { isCssProperty, splitCssProps };