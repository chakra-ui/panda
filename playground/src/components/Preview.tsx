import { css, cva, cx } from '@/design-system/css'
import { Box } from '@/design-system/jsx'
import { LiveError, LivePreview, LiveProvider } from 'react-live'
import { formatCode } from '../lib/formatCode'

export type PreviewProps = {
  previewCss?: string
  source: string
}
export const Preview = ({ previewCss, source }: PreviewProps) => {
  return (
    // TODO refactor to iframe
    <Box px="6" py="4" flex="1">
      <LiveProvider code={source.replaceAll(/import.*/g, '')} scope={{ css, cva, cx }}>
        <LiveError />
        <LivePreview />
      </LiveProvider>
      <style
        className={css({
          _before: {
            content: "'Generated styles from panda:'",
            display: 'block',
          },
          display: 'block',
          whiteSpace: 'pre',
          fontFamily: 'mono',
          fontSize: 'sm',
        })}
      >
        {formatCode(previewCss ?? '')}
      </style>
    </Box>
  )
}
