/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { SquareProperties } from "../patterns/square";

export interface SquareProps
  extends SquareProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof SquareProperties> {}

export declare const Square: FunctionComponent<SquareProps>;
