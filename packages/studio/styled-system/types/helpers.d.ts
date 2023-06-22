/* eslint-disable */
export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never