/* eslint-disable */
import type { HTMLPandaProps, JsxStyleProps, Pretty, SystemStyleObject } from '../types';

type StylePropsKeys<TProps> = keyof TProps & keyof JsxStyleProps;

declare const isCssProperty: (value: string) => boolean;
declare const splitCssProps: <TProps, Keys = StylePropsKeys<TProps>>(props: TProps) => [Pretty<Pick<TProps, Keys>>, Pretty<Omit<TProps, Keys>>]

export { isCssProperty, splitCssProps };