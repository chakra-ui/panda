/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { CircleProperties } from "../patterns/circle";

export interface CircleProps
  extends CircleProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CircleProperties> {}

export declare const Circle: FunctionComponent<CircleProps>;
