/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { SquareProperties } from "../patterns/square";

export interface SquareProps
  extends SquareProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof SquareProperties> {}

export declare const Square: FunctionComponent<SquareProps>;
