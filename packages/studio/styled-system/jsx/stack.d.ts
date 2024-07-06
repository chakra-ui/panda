/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { StackProperties } from "../patterns/stack";

export interface StackProps
  extends StackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof StackProperties> {}

export declare const Stack: FunctionComponent<StackProps>;
