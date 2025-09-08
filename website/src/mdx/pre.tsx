import { useCallback, useRef } from 'react'
import { css, cva, cx } from '@/styled-system/css'
import { CodeActions } from './code-actions'
import { CodeFilename } from './code-filename'

type Props = React.ComponentProps<'pre'> & {
  filename?: string
  hasCopyCode?: boolean
}

const preStyles = cva({
  base: {
    bg: { base: 'gray.100', _dark: 'gray.800' },
    overflowX: 'auto',
    rounded: 'xl',
    contain: 'paint',
    '& code[data-language] .line': {
      px: '4'
    }
  },
  variants: {
    hasFilename: {
      true: {
        pt: '12',
        pb: '4'
      },
      false: {
        py: '4'
      }
    }
  }
})

const containerStyles = css({
  position: 'relative',
  mt: { base: '6', _first: '0' }
})

export const Pre = (props: Props) => {
  const {
    children,
    className = '',
    hasCopyCode,
    filename,
    style: _,
    ...rest
  } = props
  const preRef = useRef<HTMLPreElement | null>(null)

  const toggleWordWrap = useCallback(() => {
    const htmlDataset = document.documentElement.dataset
    const hasWordWrap = 'docsWordWrap' in htmlDataset
    if (hasWordWrap) {
      delete htmlDataset.docsWordWrap
    } else {
      htmlDataset.docsWordWrap = ''
    }
  }, [])

  return (
    <div className={containerStyles}>
      {filename && <CodeFilename filename={filename} />}
      <pre
        className={cx(preStyles({ hasFilename: !!filename }), className)}
        ref={preRef}
        {...rest}
      >
        {children}
      </pre>
      <CodeActions
        hasCopyCode={hasCopyCode}
        filename={filename}
        onClickWrap={toggleWordWrap}
        getClipboardValue={() =>
          preRef.current?.querySelector('code')?.textContent || ''
        }
      />
    </div>
  )
}
