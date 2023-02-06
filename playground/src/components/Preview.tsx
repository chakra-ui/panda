import Frame from 'react-frame-component'
import { LiveError, LivePreview, LiveProvider } from 'react-live'
import { css, cva, cx } from '@/design-system/css'
import { Box } from '@/design-system/jsx'
import { formatCode } from '../lib/formatCode'

export type PreviewProps = {
  previewCss?: string
  source: string
}
export const Preview = ({ previewCss = '', source }: PreviewProps) => {
  if (typeof document === 'undefined') return null
  return (
    <Box px="6" py="4" flex="1">
      <Frame head={<style>{formatCode(previewCss)}</style>}>
        <LiveProvider code={source.replaceAll(/import.*/g, '')} scope={{ css, cva, cx }}>
          <LiveError />
          <LivePreview />
        </LiveProvider>
      </Frame>
    </Box>
  )
}
