import type { NonUndefined } from "pastable/typings";
import type { Keys } from "ts-toolbelt/out/Any/Keys";
import type { KnownKeys } from "ts-toolbelt/out/Any/KnownKeys";
import type { UnionOf } from "ts-toolbelt/out/Object/UnionOf";
import { colors } from "./color-palette";
export declare const flatColors: AppThemeColorMap;
type ChakraThemeColors = typeof colors;
type PossibleThemeColorKey = SimpleColors | PossibleColorWithVariants;
type AppThemeColorMap = {
    [P in keyof ChakraThemeColors[keyof ChakraThemeColors] as PossibleThemeColorKey]: string;
};
type SimpleColors = NonObjectKeys<ChakraThemeColors>;
type ColorsWithVariants = NonStringKeys<ChakraThemeColors>;
type ColorsMapWithTheirVariants = {
    [Prop in ColorsWithVariants]: Exclude<KnownKeys<ChakraThemeColors[Prop]>, "DEFAULT">;
};
type ColorsMapWithTheirVariantsAndDefault = {
    [Color in Keys<ColorsMapWithTheirVariants>]: `${Color}.${ColorsMapWithTheirVariants[Color]}`;
};
type PossibleColorWithVariants = UnionOf<ColorsMapWithTheirVariantsAndDefault>;
type NonObjectKeys<T extends object> = {
    [K in keyof T]-?: NonUndefined<T[K]> extends object ? never : K;
}[keyof T];
type NonStringKeys<T extends object> = {
    [K in keyof T]-?: NonUndefined<T[K]> extends string ? never : K;
}[keyof T];
export {};
//# sourceMappingURL=flat-colors.d.ts.map
