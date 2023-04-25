import type { PropsWithChildren } from 'react'
import { panda } from '../../styled-system/jsx'
import type { JsxStyleProps } from '../../styled-system/types'
import { tokenDictionary } from '../utils/analysis-data'
import { getReportItemFromTokenName, getUtilityLink } from '../utils/get-report-item'
import { ColorWrapper } from './color-wrapper'

export const ColorItem = ({
  tokenName,
  children,
  ...props
}: PropsWithChildren<{ tokenName: string } & JsxStyleProps>) => {
  const token = tokenDictionary.getByName('colors.' + tokenName)
  const value = token?.value ?? tokenName
  const reportItem = getReportItemFromTokenName(tokenName)

  return (
    <panda.a href={getUtilityLink({ value: reportItem.value })} key={tokenName} {...props}>
      <ColorWrapper
        w="auto"
        minW="80px"
        h="40px"
        mb="2"
        style={{ background: value, border: '1px solid rgba(0,0,0,0.1)' }}
      />
      {children}

      {tokenName !== value && (
        <panda.div opacity={0.1}>
          <panda.span>{value}</panda.span>
        </panda.div>
      )}
    </panda.a>
  )
}
