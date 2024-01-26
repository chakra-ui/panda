/* eslint-disable */
import type { DistributiveOmit, HTMLPandaProps, JsxStyleProps, Pretty } from '../types';

declare const isCssProperty: (value: string) => boolean;

type CssPropKey = keyof JsxStyleProps
type PickedCssProps<T> = Pretty<Pick<T, CssPropKey>>
type OmittedCssProps<T> = Pretty<DistributiveOmit<T, CssPropKey>>

declare const splitCssProps: <T>(props: T) => [PickedCssProps<T>, OmittedCssProps<T>]

export { isCssProperty, splitCssProps };