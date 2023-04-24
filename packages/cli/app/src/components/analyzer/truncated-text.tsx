import { panda } from '../../../styled-system/jsx'
import type { JsxStyleProps } from '../../../styled-system/types'
import { truncate } from '../../utils/truncate'
import { QuickTooltip } from './quick-tooltip'

export const TruncatedText = ({
  text,
  characters = 24,
  ...props
}: { text: string; characters?: number } & JsxStyleProps) => {
  if (text.length > characters) {
    return (
      <QuickTooltip
        tooltip={
          <panda.span p="2" bgColor="white" border="1px solid rgba(0, 0, 0, 0.1)">
            {truncate(text, 80)}
          </panda.span>
        }
      >
        <panda.span {...props}>{text.substring(0, characters) + '...'}</panda.span>
      </QuickTooltip>
    )
  }

  return text as unknown as JSX.Element
}
