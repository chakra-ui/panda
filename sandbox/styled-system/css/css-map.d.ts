import { UserCssObject } from "../types/public"
export declare function cssMap<T extends string>(obj: Record<T, UserCssObject>): (...args: Array<T>) => UserCssObject;