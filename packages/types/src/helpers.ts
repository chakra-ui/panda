export type Pretty<T> = { [K in keyof T]: T[K] } & {}

export type Pick_<T, K> = Pick<T, Extract<keyof T, K>>
export type Omit_<T, K> = Omit<T, Extract<keyof T, K>>

export type DistributivePick<T, K> = T extends unknown
  ? keyof Pick_<T, K> extends never
    ? never
    : { [P in keyof Pick_<T, K>]: Pick_<T, K>[P] }
  : never

export type DistributiveOmit<T, K> = T extends unknown
  ? keyof Omit_<T, K> extends never
    ? never
    : { [P in keyof Omit_<T, K>]: Omit_<T, K>[P] }
  : never
