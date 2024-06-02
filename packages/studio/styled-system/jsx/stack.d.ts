/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { StackProperties } from "../patterns/stack";

export interface StackProps
  extends StackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof StackProperties> {}

export declare const Stack: FunctionComponent<StackProps>;
