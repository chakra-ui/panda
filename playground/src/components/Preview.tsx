import { Box } from '@/design-system/jsx'
import { css, cva, cx } from '@/design-system/css'
import { UserConfig } from '@pandacss/types'
import { usePanda } from '@/src/components/usePanda'
import { LiveError, LivePreview, LiveProvider } from 'react-live'

export type PreviewProps = {
  source: string
  config: UserConfig
}
export const Preview = ({ source, config }: PreviewProps) => {
  const previewCss = usePanda(source, config)

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
        {previewCss}
      </style>
    </Box>
  )
}
