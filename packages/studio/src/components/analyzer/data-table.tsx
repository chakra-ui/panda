import type { ReactNode } from 'react'
import { Grid, panda } from '../../../styled-system/jsx'
import { flex } from '../../../styled-system/patterns'

export type Column<T> = { header: string; accessor: string; cell?: (item: T) => ReactNode }

// TODO tanstack/table ? hide/show columns + sort
export function DataTable<T>({ list, columns }: { list: T[]; columns: ReadonlyArray<Column<T>> }) {
  return (
    <panda.div>
      <Grid
        gridTemplateColumns="80px repeat(auto-fit, minmax(30px, 1fr))"
        w="full"
        fontWeight="bold"
        fontSize="lg"
        mb="2"
      >
        {columns.map((column) => {
          return <panda.div key={column.header}>{column.header}</panda.div>
        })}
      </Grid>
      <panda.div className={flex({ direction: 'column', gap: '2' })}>
        {list.map((item, index) => {
          return (
            <Grid gridTemplateColumns="80px repeat(auto-fit, minmax(30px, 1fr))" w="full" key={index}>
              {columns.map((column) => {
                return (
                  <panda.div key={column.accessor} wordBreak="break-word">
                    {column.cell?.(item) ?? (item as any)[column.accessor]}
                  </panda.div>
                )
              })}
            </Grid>
          )
        })}
      </panda.div>
    </panda.div>
  )
}
