/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { CircleProperties } from "../patterns/circle";

export interface CircleProps
  extends CircleProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof CircleProperties> {}

export declare const Circle: FunctionComponent<CircleProps>;
