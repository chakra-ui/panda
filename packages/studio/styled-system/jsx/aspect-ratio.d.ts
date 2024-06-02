/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { AspectRatioProperties } from "../patterns/aspect-ratio";

export interface AspectRatioProps
  extends AspectRatioProperties,
    DistributiveOmit<
      HTMLPandaProps<"div">,
      keyof AspectRatioProperties | "aspectRatio"
    > {}

export declare const AspectRatio: FunctionComponent<AspectRatioProps>;
