/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { VisuallyHiddenProperties } from "../patterns/visually-hidden";

export interface VisuallyHiddenProps
  extends VisuallyHiddenProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof VisuallyHiddenProperties> {}

export declare const VisuallyHidden: FunctionComponent<VisuallyHiddenProps>;
