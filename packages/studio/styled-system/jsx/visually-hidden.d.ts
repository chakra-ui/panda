/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { VisuallyHiddenProperties } from "../patterns/visually-hidden";

export interface VisuallyHiddenProps
  extends VisuallyHiddenProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof VisuallyHiddenProperties> {}

export declare const VisuallyHidden: FunctionComponent<VisuallyHiddenProps>;
