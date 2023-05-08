import type { FunctionComponent } from 'react'

export type LayoutGridProps = {
  count?: number
  gutter?: string
  maxWidth?: string
  margin?: string
  outline?: boolean
}

export declare const LayoutGrid: FunctionComponent<LayoutGridProps>