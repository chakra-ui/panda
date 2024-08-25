/* eslint-disable */
import type {
  DistributiveOmit,
  JsxStyleProps,
  Pretty,
} from "../types/index.d.ts";

declare const isCssProperty: (value: string) => boolean;

type CssPropKey = keyof JsxStyleProps;
type OmittedCssProps<T> = Pretty<DistributiveOmit<T, CssPropKey>>;

declare const splitCssProps: <T>(
  props: T,
) => [JsxStyleProps, OmittedCssProps<T>];

export { isCssProperty, splitCssProps };
