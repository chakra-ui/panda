import type * as P from "postcss";

export type TailwindContext = {
  getClassOrder: (
    classes: string[]
  ) => Array<[className: string, order: bigint]>;
  candidateRuleMap: Array<[string, Candidate[]]>;
  variantMap: Array<Record<string, never>>;
};

export type Candidate = [
  data: { layer: string },
  rule: P.Rule | P.AtRule | P.Declaration
];

export type TailwindMatchOptions = {
  preserveSource?: boolean;
  respectPrefix?: boolean;
  respectImportant?: boolean;
  values?: Record<string, string>;
};
export type TailwindMatch = [
  TailwindMatchInfos,
  P.Rule | P.AtRule | P.Declaration
];

interface TailwindMatchInfos {
  sort: {
    layer: string;
    parentLayer: string;
    arbitrary: number;
    variants: number;
    parallelIndex: number;
    index: number;
    options: Option[];
  };
  layer?: string;
  options: TailwindMatchOptions;
  collectedFormats: CollectedFormat[];
}

interface Option {
  modifier: any;
  value: any;
  id: string;
  sort: any[];
  variant: number;
}

interface CollectedFormat {
  format: string;
  isArbitraryVariant: boolean;
}
