import { css } from '../../styled-system/css'

/* -----------------------------------------------------------------------------
 * Code filename
 * -----------------------------------------------------------------------------*/
const filenameStyles = css({
  position: 'absolute',
  top: '0',
  zIndex: '1',
  width: 'full',
  truncate: true,
  roundedTop: 'xl',
  bg: { base: 'gray.200', _dark: 'gray.700' },
  py: '2',
  px: '4',
  textStyle: 'sm',
  color: { base: 'gray.700', _dark: 'gray.300' }
})

export function CodeFilename(props: { filename: string }) {
  const { filename } = props
  return <div className={filenameStyles}>{filename}</div>
}
