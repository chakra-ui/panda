import { SystemStyleObject } from "../types"

export declare function cssMap<T extends string>(obj: Record<T, SystemStyleObject>): (...args: Array<T>) => string;