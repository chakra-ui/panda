/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { AspectRatioProperties } from "../patterns/aspect-ratio";

export interface AspectRatioProps
  extends AspectRatioProperties,
    DistributiveOmit<
      HTMLPandaProps<"div">,
      keyof AspectRatioProperties | "aspectRatio"
    > {}

export declare const AspectRatio: FunctionComponent<AspectRatioProps>;
