import type { ReportItemJSON } from '@pandacss/types'
import { panda } from '../../../styled-system/jsx'
import { ReportItemOpenInEditorLink, UtilityLink } from './report-item-link'
import { QuickTooltip } from './quick-tooltip'

export const reportItemColumns = [
  {
    header: '#',
    accessor: 'id',
    cell: (item: ReportItemJSON) => <panda.span onClick={() => console.log(item)}>{item.id}</panda.span>,
  },
  { header: 'from', accessor: 'from', cell: (item: ReportItemJSON) => <UtilityLink from={item.from} /> },
  {
    header: 'category',
    accessor: 'category',
    cell: (item: ReportItemJSON) => <UtilityLink category={item.category} />,
  },
  {
    header: 'property name',
    accessor: 'propName',
    cell: (item: ReportItemJSON) => <UtilityLink propName={item.propName} />,
  },
  {
    header: 'token name',
    accessor: 'value',
    cell: (item: ReportItemJSON) => {
      return (
        <panda.div display="flex" alignItems="center">
          {!item.isKnown && (
            <QuickTooltip
              tooltip={
                <panda.span p="2" bgColor="white" border="1px solid rgba(0, 0, 0, 0.1)">
                  unknown token
                </panda.span>
              }
            >
              <panda.span mr="2" userSelect="none">
                {'❌'}
              </panda.span>
            </QuickTooltip>
          )}
          <UtilityLink value={item.value} />
        </panda.div>
      )
    },
  },
  {
    header: 'filepath',
    accessor: 'filepath',
    cell: (item: ReportItemJSON) => <ReportItemOpenInEditorLink withRange {...item} />,
  },
] as const // TODO satisifes Column[]
